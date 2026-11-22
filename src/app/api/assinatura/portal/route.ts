import { admin, json, origemDe, servidorConfigurado, usuaria } from '@/lib/assinatura/servidor';
import { stripe, stripeConfigurado } from '@/lib/assinatura/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Abre o portal do Stripe: cartão, faturas e cancelamento. */
export async function POST(req: Request) {
  if (!stripeConfigurado() || !servidorConfigurado()) return json({ erro: 'Pagamentos não configurados.' }, 503);
  const u = await usuaria(req);
  if (!u) return json({ erro: 'Entre na sua conta.' }, 401);
  const { data: cli } = await admin().from('clientes_pagamento').select('provedor_cliente_id').eq('user_id', u.uid).maybeSingle();
  if (!cli?.provedor_cliente_id) return json({ erro: 'Não há pagamentos nesta conta.' }, 404);
  try {
    const s = await stripe<{ url: string }>('POST', '/billing_portal/sessions', { customer: cli.provedor_cliente_id, return_url: `${origemDe(req)}/assinatura/`, locale: 'pt-BR' });
    return json({ url: s.url });
  } catch (e) {
    console.error('[portal]', e);
    return json({ erro: 'Não foi possível abrir o gerenciamento de pagamento agora.' }, 502);
  }
}
