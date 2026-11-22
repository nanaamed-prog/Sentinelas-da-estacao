/**
 * Utilidades de servidor para assinaturas e controle de acesso.
 * NUNCA importar em componentes do navegador: usa a chave de serviço do Supabase e a chave secreta do Stripe.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { stripe, normalizar, type StripeSub } from './stripe';
import type { PlanoId } from './planos';

export const json = (d: unknown, status = 200) => Response.json(d, { status, headers: { 'Cache-Control': 'no-store' } });

const URL_SB = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const servidorConfigurado = () => Boolean(URL_SB() && ANON() && process.env.SUPABASE_SERVICE_ROLE_KEY);

/** Cliente com a chave de serviço (ignora RLS) — apenas para gravar o que veio do provedor. */
export function admin(): SupabaseClient {
  return createClient(URL_SB()!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Cliente com o token da usuária (todas as leituras passam pelo RLS). */
export function comToken(token?: string | null): SupabaseClient {
  return createClient(URL_SB()!, ANON()!, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const tokenDe = (req: Request) => req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;

/** Usuária autenticada (validada pelo Supabase, não pelo navegador). */
export async function usuaria(req: Request): Promise<{ uid: string; email?: string; sb: SupabaseClient; token: string } | null> {
  const token = tokenDe(req);
  if (!token || !URL_SB() || !ANON()) return null;
  const sb = comToken(token);
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return { uid: data.user.id, email: data.user.email ?? undefined, sb, token };
}

export interface Acesso { ativas: boolean; completo: boolean; uid: string | null }

const funcaoAusente = (e: { code?: string; message?: string }) =>
  e.code === 'PGRST202' || e.code === '42883' || /could not find the function/i.test(e.message ?? '');

/**
 * Acesso ao plano completo, decidido no banco (função tem_acesso_completo).
 * Se a estrutura de assinaturas ainda não foi instalada no banco, tudo segue liberado (comportamento anterior).
 * Qualquer outro erro é tratado como falha (o chamador responde 503), nunca como acesso liberado.
 */
export async function verificarAcesso(req: Request): Promise<Acesso> {
  if (!URL_SB() || !ANON()) return { ativas: false, completo: true, uid: null };
  const u = await usuaria(req);
  const sb = u?.sb ?? comToken(null);
  const { data, error } = await sb.rpc('meu_acesso');
  if (error) {
    if (funcaoAusente(error)) return { ativas: false, completo: true, uid: u?.uid ?? null };
    throw new Error('acesso_indisponivel');
  }
  const d = data as { assinaturas_ativas: boolean; completo: boolean };
  return { ativas: Boolean(d.assinaturas_ativas), completo: Boolean(d.completo), uid: u?.uid ?? null };
}

/** Plano do app a partir do preço do provedor. */
export async function planoDoPreco(db: SupabaseClient, precoId: string | null): Promise<PlanoId | null> {
  if (!precoId) return null;
  const { data } = await db.from('planos').select('id').eq('provedor_preco_id', precoId).maybeSingle();
  return (data?.id as PlanoId) ?? null;
}

/** Usuária dona de um cliente do provedor. */
export async function usuariaDoCliente(db: SupabaseClient, clienteId: string): Promise<string | null> {
  const { data } = await db.from('clientes_pagamento').select('user_id').eq('provedor_cliente_id', clienteId).maybeSingle();
  return data?.user_id ?? null;
}

/**
 * Lê a assinatura NO PROVEDOR (fonte da verdade) e grava. Por sempre reler o estado atual,
 * eventos duplicados ou fora de ordem levam ao mesmo resultado.
 */
export async function sincronizarAssinatura(db: SupabaseClient, subId: string): Promise<{ user_id: string | null; vigentes: number }> {
  const lidoEm = new Date().toISOString();
  const sub = await stripe<StripeSub>('GET', `/subscriptions/${encodeURIComponent(subId)}`);
  return gravar(db, sub, lidoEm);
}

export async function gravar(db: SupabaseClient, sub: StripeSub, lidoEm: string) {
  const n = normalizar(sub);
  const dono = await usuariaDoCliente(db, n.cliente_id);
  // o vínculo vem do cliente criado pelo próprio app; os metadados só valem se coincidirem
  const userId = dono ?? n.user_id;
  if (!userId || (dono && n.user_id && dono !== n.user_id)) return { user_id: null, vigentes: 0 };
  const plano = await planoDoPreco(db, n.preco_id);
  const { data, error } = await db.rpc('gravar_assinatura', { a: { ...n, user_id: userId, plano_id: plano ?? '', lido_em: lidoEm } });
  if (error) throw new Error(`gravar_assinatura: ${error.message}`);
  if ((data as number) > 1) console.warn('[assinaturas] possível assinatura duplicada para', userId);
  return { user_id: userId, vigentes: data as number };
}

/** Reconciliação: relê todas as assinaturas de um cliente no provedor. */
export async function sincronizarCliente(db: SupabaseClient, clienteId: string) {
  const lidoEm = new Date().toISOString();
  const lista = await stripe<{ data: StripeSub[] }>('GET', '/subscriptions', { customer: clienteId, status: 'all', limit: 20 });
  for (const sub of lista.data) await gravar(db, sub, lidoEm);
  return lista.data;
}

export const origemDe = (req: Request) => (process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, '');
