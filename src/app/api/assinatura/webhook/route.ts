import { admin, servidorConfigurado } from '@/lib/assinatura/servidor';
import { processarEvento, type EventoStripe } from '@/lib/assinatura/eventos';
import { webhookAutentico } from '@/lib/assinatura/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Webhook do Stripe — única fonte de confirmação de pagamento.
 * 1) valida a assinatura do cabeçalho; 2) registra o evento (idempotência);
 * 3) relê no provedor o estado atual e grava; 4) marca como processado.
 * Em erro responde 500 para o Stripe reenviar.
 */
export async function POST(req: Request) {
  const segredo = process.env.STRIPE_WEBHOOK_SECRET;
  if (!segredo || !servidorConfigurado()) return new Response('não configurado', { status: 503 });
  const corpo = await req.text();
  if (!webhookAutentico(corpo, req.headers.get('stripe-signature'), segredo)) return new Response('assinatura inválida', { status: 400 });

  let ev: EventoStripe;
  try { ev = JSON.parse(corpo); } catch { return new Response('corpo inválido', { status: 400 }); }

  const db = admin();
  const { data: processar, error } = await db.rpc('registrar_evento', { p_id: ev.id, p_tipo: ev.type, p_criado: new Date(ev.created * 1000).toISOString() });
  if (error) return new Response('falha ao registrar', { status: 500 });
  if (!processar) return Response.json({ recebido: true, duplicado: true });

  try {
    await processarEvento(db, ev);
    await db.rpc('concluir_evento', { p_id: ev.id, p_erro: null });
    return Response.json({ recebido: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[webhook]', ev.type, msg);
    await db.rpc('concluir_evento', { p_id: ev.id, p_erro: msg.slice(0, 500) });
    return new Response('erro ao processar', { status: 500 });
  }
}
