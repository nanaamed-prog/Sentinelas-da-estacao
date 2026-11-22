import { z } from 'zod';
import { admin, json, origemDe, servidorConfigurado, sincronizarCliente, usuaria } from '@/lib/assinatura/servidor';
import { ErroStripe, stripe, stripeConfigurado, mapearStatus } from '@/lib/assinatura/stripe';
import { caminhoSeguro } from '@/lib/assinatura/planos';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const corpo = z.object({ plano: z.enum(['mensal', 'anual']), voltar: z.string().max(200).optional() });

/** Inicia o checkout hospedado pelo Stripe. A liberação do acesso só acontece após a confirmação do provedor. */
export async function POST(req: Request) {
  if (!stripeConfigurado() || !servidorConfigurado()) return json({ erro: 'As assinaturas ainda não estão disponíveis.' }, 503);
  const u = await usuaria(req);
  if (!u) return json({ erro: 'Entre na sua conta para assinar.' }, 401);
  let d: z.infer<typeof corpo>;
  try { d = corpo.parse(await req.json()); } catch { return json({ erro: 'Pedido inválido.' }, 400); }

  const db = admin();
  const { data: plano } = await db.from('planos').select('id, provedor_preco_id, ativo').eq('id', d.plano).maybeSingle();
  if (!plano?.ativo || !plano.provedor_preco_id) return json({ erro: 'Este plano ainda não está disponível.' }, 503);

  // já existe assinatura vigente? (evita duas assinaturas para a mesma pessoa)
  const { data: vig } = await db.from('assinaturas').select('id').eq('user_id', u.uid).eq('provedor', 'stripe')
    .in('status', ['ativa', 'em_atraso', 'pendente']).limit(1);
  if (vig?.length) return json({ erro: 'Você já tem uma assinatura. Gerencie-a em Minha assinatura.', gerenciar: true }, 409);

  try {
    let { data: cli } = await db.from('clientes_pagamento').select('*').eq('user_id', u.uid).maybeSingle();

    // checkout já aberto: reutiliza (mesmo plano) ou expira o anterior (outro plano)
    if (cli?.checkout_sessao_id && cli.checkout_expira_em && new Date(cli.checkout_expira_em) > new Date()) {
      if (cli.checkout_plano === d.plano && cli.checkout_url) return json({ url: cli.checkout_url });
      await stripe('POST', `/checkout/sessions/${encodeURIComponent(cli.checkout_sessao_id)}/expire`).catch(() => undefined);
    }

    if (!cli?.provedor_cliente_id) {
      const c = await stripe<{ id: string }>('POST', '/customers', { email: u.email, metadata: { user_id: u.uid } }, `cliente-${u.uid}`);
      const { data: novo, error } = await db.from('clientes_pagamento')
        .upsert({ user_id: u.uid, provedor_cliente_id: c.id, atualizado_em: new Date().toISOString() }).select('*').single();
      if (error) throw error;
      cli = novo;
    } else {
      // reconciliação: o provedor pode ter uma assinatura que o app ainda não recebeu
      const subs = await sincronizarCliente(db, cli.provedor_cliente_id);
      if (subs.some((s) => ['ativa', 'em_atraso', 'pendente'].includes(mapearStatus(s.status))))
        return json({ erro: 'Você já tem uma assinatura. Gerencie-a em Minha assinatura.', gerenciar: true }, 409);
    }

    const origem = origemDe(req);
    const voltar = encodeURIComponent(caminhoSeguro(d.voltar, '/'));
    const expira = Math.floor(Date.now() / 1000) + 31 * 60;
    const sessao = await stripe<{ id: string; url: string }>('POST', '/checkout/sessions', {
      mode: 'subscription',
      customer: cli!.provedor_cliente_id,
      client_reference_id: u.uid,
      line_items: [{ price: plano.provedor_preco_id, quantity: 1 }],
      success_url: `${origem}/assinatura/?checkout=retorno&voltar=${voltar}`,
      cancel_url: `${origem}/planos/?checkout=cancelado&voltar=${voltar}`,
      locale: 'pt-BR',
      expires_at: expira,
      metadata: { user_id: u.uid, plano: d.plano },
      subscription_data: { metadata: { user_id: u.uid, plano: d.plano } },
    }, `checkout-${u.uid}-${d.plano}-${Math.floor(Date.now() / 120_000)}`);

    await db.from('clientes_pagamento').update({
      checkout_sessao_id: sessao.id, checkout_plano: d.plano, checkout_url: sessao.url,
      checkout_expira_em: new Date(expira * 1000).toISOString(), atualizado_em: new Date().toISOString(),
    }).eq('user_id', u.uid);
    return json({ url: sessao.url });
  } catch (e) {
    console.error('[checkout]', e instanceof ErroStripe ? `${e.status} ${e.codigo}` : e);
    return json({ erro: 'Não foi possível abrir o pagamento agora. Tente novamente em instantes.' }, 502);
  }
}
