import { json, usuaria, verificarAcesso, comToken } from '@/lib/assinatura/servidor';
import { stripeConfigurado, stripeModoTeste } from '@/lib/assinatura/stripe';
import { PLANOS_PADRAO } from '@/lib/assinatura/planos';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Situação da assinatura da usuária (lida do banco, gravado somente a partir do provedor). */
export async function GET(req: Request) {
  let acesso;
  try { acesso = await verificarAcesso(req); } catch { return json({ erro: 'Não foi possível verificar agora.' }, 503); }
  const u = await usuaria(req);
  const sb = u?.sb ?? (process.env.NEXT_PUBLIC_SUPABASE_URL ? comToken(null) : null);

  let planos = PLANOS_PADRAO;
  if (sb) {
    const { data } = await sb.from('planos').select('id, nome, periodicidade, valor_centavos, moeda, provedor_preco_id, ativo').order('valor_centavos');
    if (data?.length) planos = data.filter((p) => p.ativo).map((p) => ({
      id: p.id, nome: p.nome, periodicidade: p.periodicidade, valorCentavos: p.valor_centavos, moeda: p.moeda,
      disponivel: Boolean(p.provedor_preco_id) && stripeConfigurado(),
    }));
  }

  let assinatura = null;
  let contestacao = false;
  if (u) {
    const { data } = await u.sb.from('assinaturas')
      .select('id, provedor, plano_id, status, periodo_inicio, periodo_fim, cancelar_no_fim, cancelada_em, atualizada_em')
      .order('atualizada_em', { ascending: false }).limit(5);
    // a vigente tem prioridade; depois a mais recente
    const ordem = ['ativa', 'em_atraso', 'pendente', 'suspensa', 'pausada', 'cancelada', 'expirada'];
    assinatura = (data ?? []).sort((a, b) => ordem.indexOf(a.status) - ordem.indexOf(b.status))[0] ?? null;
    const { data: c } = await u.sb.from('clientes_pagamento').select('contestacao_aberta, provedor_cliente_id').maybeSingle();
    contestacao = Boolean(c?.contestacao_aberta);
  }

  return json({
    ativas: acesso.ativas,
    completo: acesso.completo,
    logada: Boolean(u),
    checkout: stripeConfigurado() && planos.some((p) => p.disponivel),
    modoTeste: stripeModoTeste(),
    planos,
    assinatura,
    contestacao,
  });
}
