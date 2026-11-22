/**
 * Prévia estática: simula as rotas do servidor (sem pagamentos de verdade).
 * O plano da prévia fica guardado neste navegador e pode ser trocado em Planos / Minha assinatura.
 */
import { LIVRO } from '@/lib/conteudo-pago/biblioteca';
import { DADOS_ORACOES } from '@/lib/conteudo-pago/oracoes';
import { PLANOS_PADRAO, CAPITULOS_GRATUITOS } from '@/lib/assinatura/planos';

const K = 'sentinelas:previa:assinatura';
type A = { plano_id: 'mensal' | 'anual'; status: string; periodo_fim: string; cancelar_no_fim: boolean } | null;
const ler = (): A => { try { return JSON.parse(localStorage.getItem(K) ?? 'null'); } catch { return null; } };
const gravar = (a: A) => { try { a ? localStorage.setItem(K, JSON.stringify(a)) : localStorage.removeItem(K); } catch { /* noop */ } };
const completo = () => { const a = ler(); return Boolean(a && Date.parse(a.periodo_fim) > Date.now()); };

export async function chamar<T>(caminho: string, _token: string | null, init?: { metodo?: 'GET' | 'POST'; corpo?: unknown }): Promise<{ ok: boolean; status: number; dados: T }> {
  const r = (dados: unknown, status = 200) => ({ ok: status < 400, status, dados: dados as T });
  const corpo = (init?.corpo ?? {}) as Record<string, string>;
  if (caminho === '/api/assinatura') {
    const a = ler();
    return r({ ativas: true, completo: completo(), logada: true, checkout: true, modoTeste: true,
      planos: PLANOS_PADRAO.map((p) => ({ ...p, disponivel: true })),
      assinatura: a && { id: 'previa', provedor: 'stripe', periodo_inicio: null, cancelada_em: null, ...a }, contestacao: false });
  }
  if (caminho === '/api/assinatura/checkout') {
    const anual = corpo.plano === 'anual';
    const fim = new Date(); anual ? fim.setFullYear(fim.getFullYear() + 1) : fim.setMonth(fim.getMonth() + 1);
    gravar({ plano_id: anual ? 'anual' : 'mensal', status: 'ativa', periodo_fim: fim.toISOString(), cancelar_no_fim: false });
    location.hash = `#assinatura?checkout=retorno&voltar=${encodeURIComponent(corpo.voltar ?? '/')}`;
    return r({});
  }
  if (caminho === '/api/assinatura/cancelar') {
    const a = ler(); if (a) gravar({ ...a, cancelar_no_fim: corpo.acao === 'cancelar' });
    return r({ ok: true });
  }
  if (caminho === '/api/assinatura/portal') return r({ erro: 'Na prévia não há gerenciamento de pagamento.' }, 503);
  if (caminho === '/api/assinatura/sincronizar') return r({ ok: true });
  if (caminho === '/api/conteudo/biblioteca') {
    const { capitulos, ...livro } = LIVRO;
    return r({ livro, capitulos: completo() ? capitulos : capitulos.filter((c) => CAPITULOS_GRATUITOS.includes(c.slug)), completo: completo() });
  }
  if (caminho === '/api/conteudo/oracoes') return completo() ? r({ ...DADOS_ORACOES, completo: true }) : r({ erro: 'Recurso do Sentinelas Completo.' }, 403);
  return r({ erro: 'indisponível na prévia' }, 503);
}

/** botão da prévia para voltar ao plano gratuito */
export const previaEncerrar = () => { gravar(null); location.reload(); };
