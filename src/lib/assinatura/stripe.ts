/**
 * Integração com o Stripe — SOMENTE NO SERVIDOR (rotas em src/app/api/assinatura).
 * Usa a API REST diretamente (sem SDK), com versão fixa, chave secreta apenas em variável de ambiente
 * e checkout hospedado pelo Stripe (o app nunca vê dados de cartão).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const STRIPE_VERSAO = '2025-03-31.basil';
const BASE = 'https://api.stripe.com/v1';

export const stripeConfigurado = () => Boolean(process.env.STRIPE_SECRET_KEY);
/** chave de teste (sk_test_) não gera cobranças reais */
export const stripeModoTeste = () => (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_test_');

type Param = string | number | boolean | null | undefined | Param[] | { [k: string]: Param };

/** Codifica parâmetros aninhados no formato do Stripe: a[b][0][c]=valor */
export function codificar(obj: Record<string, Param>, prefixo = ''): string {
  const partes: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const chave = prefixo ? `${prefixo}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((item, i) => {
      if (item !== null && typeof item === 'object') partes.push(codificar(item as Record<string, Param>, `${chave}[${i}]`));
      else if (item !== undefined && item !== null) partes.push(`${encodeURIComponent(`${chave}[${i}]`)}=${encodeURIComponent(String(item))}`);
    });
    else if (typeof v === 'object') partes.push(codificar(v as Record<string, Param>, chave));
    else partes.push(`${encodeURIComponent(chave)}=${encodeURIComponent(String(v))}`);
  }
  return partes.filter(Boolean).join('&');
}

export class ErroStripe extends Error {
  constructor(public status: number, public codigo: string, mensagem: string) { super(mensagem); }
}

export async function stripe<T = Record<string, unknown>>(
  metodo: 'GET' | 'POST' | 'DELETE', caminho: string, params?: Record<string, Param>, chaveIdempotencia?: string,
): Promise<T> {
  const chave = process.env.STRIPE_SECRET_KEY;
  if (!chave) throw new ErroStripe(503, 'nao_configurado', 'Pagamentos não configurados.');
  const corpo = params ? codificar(params) : '';
  const url = metodo === 'GET' && corpo ? `${BASE}${caminho}?${corpo}` : `${BASE}${caminho}`;
  const r = await fetch(url, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${chave}`,
      'Stripe-Version': STRIPE_VERSAO,
      ...(metodo !== 'GET' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      ...(chaveIdempotencia ? { 'Idempotency-Key': chaveIdempotencia } : {}),
    },
    body: metodo !== 'GET' && corpo ? corpo : undefined,
    cache: 'no-store',
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = (dados as { error?: { code?: string; message?: string } }).error;
    throw new ErroStripe(r.status, e?.code ?? 'erro', e?.message ?? `Stripe respondeu ${r.status}`);
  }
  return dados as T;
}

/**
 * Valida o cabeçalho Stripe-Signature (t=...,v1=...): HMAC-SHA256 de `${t}.${corpo}` com o segredo do endpoint,
 * comparação em tempo constante e tolerância de 5 minutos contra reenvio.
 */
export function webhookAutentico(corpo: string, cabecalho: string | null, segredo: string, agoraSeg = Math.floor(Date.now() / 1000), tolerancia = 300): boolean {
  if (!cabecalho || !segredo) return false;
  const partes = cabecalho.split(',').map((p) => p.split('=') as [string, string]);
  const t = Number(partes.find(([k]) => k === 't')?.[1]);
  const assinaturas = partes.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!Number.isFinite(t) || !assinaturas.length || Math.abs(agoraSeg - t) > tolerancia) return false;
  const esperado = Buffer.from(createHmac('sha256', segredo).update(`${t}.${corpo}`, 'utf8').digest('hex'));
  return assinaturas.some((a) => { const b = Buffer.from(a); return b.length === esperado.length && timingSafeEqual(b, esperado); });
}

/** Gera um cabeçalho válido (usado nos testes). */
export function assinarWebhook(corpo: string, segredo: string, t = Math.floor(Date.now() / 1000)) {
  return `t=${t},v1=${createHmac('sha256', segredo).update(`${t}.${corpo}`, 'utf8').digest('hex')}`;
}

export type StatusAssinatura = 'pendente' | 'ativa' | 'em_atraso' | 'suspensa' | 'pausada' | 'cancelada' | 'expirada';

/** Situação do Stripe → situação do app. `past_due` mantém o acesso durante as novas tentativas de cobrança. */
export function mapearStatus(s: string): StatusAssinatura {
  switch (s) {
    case 'active': case 'trialing': return 'ativa';
    case 'past_due': return 'em_atraso';
    case 'incomplete': return 'pendente';
    case 'incomplete_expired': return 'expirada';
    case 'unpaid': return 'suspensa';
    case 'paused': return 'pausada';
    case 'canceled': return 'cancelada';
    default: return 'suspensa';
  }
}

export interface StripeSub {
  id: string; status: string; customer: string | { id: string };
  cancel_at_period_end?: boolean; cancel_at?: number | null; canceled_at?: number | null; ended_at?: number | null;
  current_period_start?: number; current_period_end?: number; start_date?: number;
  metadata?: Record<string, string>;
  items?: { data: { price?: { id: string }; current_period_start?: number; current_period_end?: number }[] };
}

const iso = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);

/** Normaliza a assinatura (períodos ficam nos itens a partir da versão basil). */
export function normalizar(sub: StripeSub) {
  const item = sub.items?.data?.[0];
  const fimItens = sub.items?.data?.map((i) => i.current_period_end ?? 0).filter(Boolean) ?? [];
  const fim = fimItens.length ? Math.min(...fimItens) : sub.current_period_end;
  return {
    provedor_assinatura_id: sub.id,
    cliente_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    user_id: sub.metadata?.user_id ?? null,
    preco_id: item?.price?.id ?? null,
    status: mapearStatus(sub.status),
    periodo_inicio: iso(item?.current_period_start ?? sub.current_period_start ?? sub.start_date),
    periodo_fim: iso(sub.ended_at ?? fim),
    cancelar_no_fim: Boolean(sub.cancel_at_period_end || (sub.cancel_at && sub.status !== 'canceled')),
    cancelada_em: iso(sub.canceled_at),
  };
}

/** id da assinatura em uma fatura (campo mudou de lugar na versão basil) */
export function assinaturaDaFatura(inv: { subscription?: string | { id: string } | null; parent?: { subscription_details?: { subscription?: string | { id: string } } | null } | null }): string | null {
  const s = inv.parent?.subscription_details?.subscription ?? inv.subscription ?? null;
  return s ? (typeof s === 'string' ? s : s.id) : null;
}
