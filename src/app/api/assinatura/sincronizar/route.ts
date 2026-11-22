import { admin, json, servidorConfigurado, sincronizarCliente, usuaria } from '@/lib/assinatura/servidor';
import { stripeConfigurado } from '@/lib/assinatura/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Reconciliação: consulta o provedor e atualiza a assinatura (ex.: ao voltar do checkout ou em “Atualizar”). */
export async function POST(req: Request) {
  if (!stripeConfigurado() || !servidorConfigurado()) return json({ ok: false, motivo: 'nao_configurado' });
  const u = await usuaria(req);
  if (!u) return json({ erro: 'Entre na sua conta.' }, 401);
  const db = admin();
  const { data: cli } = await db.from('clientes_pagamento').select('provedor_cliente_id').eq('user_id', u.uid).maybeSingle();
  if (!cli?.provedor_cliente_id) return json({ ok: true, assinaturas: 0 });
  try {
    const subs = await sincronizarCliente(db, cli.provedor_cliente_id);
    return json({ ok: true, assinaturas: subs.length });
  } catch (e) {
    console.error('[sincronizar]', e);
    return json({ erro: 'Não foi possível consultar o pagamento agora.' }, 502);
  }
}
