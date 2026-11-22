import { z } from 'zod';
import { admin, gravar, json, servidorConfigurado, usuaria } from '@/lib/assinatura/servidor';
import { stripe, stripeConfigurado, type StripeSub } from '@/lib/assinatura/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const corpo = z.object({ acao: z.enum(['cancelar', 'reativar']) });

/**
 * Cancelar: a renovação é desligada e o acesso continua até o fim do período já pago.
 * Reativar: volta a renovar (enquanto o período ainda não terminou).
 * Nenhum registro pessoal é apagado.
 */
export async function POST(req: Request) {
  if (!stripeConfigurado() || !servidorConfigurado()) return json({ erro: 'Pagamentos não configurados.' }, 503);
  const u = await usuaria(req);
  if (!u) return json({ erro: 'Entre na sua conta.' }, 401);
  let d: z.infer<typeof corpo>;
  try { d = corpo.parse(await req.json()); } catch { return json({ erro: 'Pedido inválido.' }, 400); }
  const db = admin();
  const { data: a } = await db.from('assinaturas').select('provedor_assinatura_id, status').eq('user_id', u.uid).eq('provedor', 'stripe')
    .in('status', ['ativa', 'em_atraso', 'pendente']).order('atualizada_em', { ascending: false }).limit(1).maybeSingle();
  if (!a?.provedor_assinatura_id) return json({ erro: 'Não há assinatura em andamento.' }, 404);
  try {
    const lido = new Date().toISOString();
    const sub = a.status === 'pendente' && d.acao === 'cancelar'
      ? await stripe<StripeSub>('DELETE', `/subscriptions/${encodeURIComponent(a.provedor_assinatura_id)}`)
      : await stripe<StripeSub>('POST', `/subscriptions/${encodeURIComponent(a.provedor_assinatura_id)}`, { cancel_at_period_end: d.acao === 'cancelar' },
        `${d.acao}-${a.provedor_assinatura_id}-${Math.floor(Date.now() / 60_000)}`);
    await gravar(db, sub, lido);
    return json({ ok: true });
  } catch (e) {
    console.error('[cancelar]', e);
    return json({ erro: 'Não foi possível concluir agora. Nada foi alterado; tente novamente.' }, 502);
  }
}
