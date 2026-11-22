/** Tratamento dos eventos do Stripe (servidor). */
import type { SupabaseClient } from '@supabase/supabase-js';
import { sincronizarAssinatura, sincronizarCliente, usuariaDoCliente } from './servidor';
import { assinaturaDaFatura, stripe, mapearStatus, type StripeSub } from './stripe';

export interface EventoStripe { id: string; type: string; created: number; data: { object: Record<string, unknown> } }

const idDe = (v: unknown): string | null => (typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? String((v as { id: string }).id) : null);

/** Reembolso total encerra o acesso na hora (padrão). Defina REEMBOLSO_TOTAL_ENCERRA=nao para manter. */
const reembolsoEncerra = () => (process.env.REEMBOLSO_TOTAL_ENCERRA ?? 'sim') !== 'nao';

async function cancelarVigentes(db: SupabaseClient, clienteId: string, motivo: string) {
  const subs = await stripe<{ data: StripeSub[] }>('GET', '/subscriptions', { customer: clienteId, status: 'all', limit: 20 });
  for (const s of subs.data) {
    if (['ativa', 'em_atraso', 'pendente'].includes(mapearStatus(s.status))) {
      await stripe('DELETE', `/subscriptions/${encodeURIComponent(s.id)}`, undefined, `encerrar-${s.id}-${motivo}`);
    }
  }
  await sincronizarCliente(db, clienteId);
}

async function marcarContestacao(db: SupabaseClient, clienteId: string, aberta: boolean) {
  const uid = await usuariaDoCliente(db, clienteId);
  if (!uid) return;
  await db.from('clientes_pagamento').update({ contestacao_aberta: aberta, atualizado_em: new Date().toISOString() }).eq('user_id', uid);
}

export async function processarEvento(db: SupabaseClient, ev: EventoStripe): Promise<void> {
  const o = ev.data.object;
  switch (ev.type) {
    // checkout concluído: libera a trava de checkout e lê a assinatura no provedor
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired': {
      const cliente = idDe(o.customer);
      const uid = (o.client_reference_id as string | null) ?? (cliente ? await usuariaDoCliente(db, cliente) : null);
      if (uid) await db.from('clientes_pagamento').update({ checkout_sessao_id: null, checkout_plano: null, checkout_url: null, checkout_expira_em: null })
        .eq('user_id', uid).eq('checkout_sessao_id', String(o.id));
      const sub = idDe(o.subscription);
      if (sub) await sincronizarAssinatura(db, sub);
      return;
    }
    // ciclo de vida da assinatura: criação, renovação, cancelamento agendado, término, pausa
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.paused':
    case 'customer.subscription.resumed':
      await sincronizarAssinatura(db, String(o.id));
      return;
    // cobrança confirmada (renovação) ou falha de pagamento
    case 'invoice.paid':
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed':
    case 'invoice.payment_action_required': {
      const sub = assinaturaDaFatura(o as Parameters<typeof assinaturaDaFatura>[0]);
      if (sub) await sincronizarAssinatura(db, sub);
      else if (idDe(o.customer)) await sincronizarCliente(db, idDe(o.customer)!);
      return;
    }
    // reembolso: total encerra a assinatura (configurável); parcial mantém
    case 'charge.refunded': {
      const cliente = idDe(o.customer);
      if (!cliente) return;
      const total = Number(o.amount_refunded) >= Number(o.amount);
      if (total && reembolsoEncerra()) await cancelarVigentes(db, cliente, `reembolso-${o.id}`);
      else await sincronizarCliente(db, cliente);
      return;
    }
    // contestação: acesso suspenso enquanto está aberta; perdida encerra a assinatura
    case 'charge.dispute.created':
    case 'charge.dispute.closed': {
      const cobranca = await stripe<{ customer: string | null }>('GET', `/charges/${encodeURIComponent(String(o.charge))}`);
      if (!cobranca.customer) return;
      if (ev.type === 'charge.dispute.created') { await marcarContestacao(db, cobranca.customer, true); return; }
      await marcarContestacao(db, cobranca.customer, false);
      if (o.status === 'lost') await cancelarVigentes(db, cobranca.customer, `contestacao-${o.id}`);
      else await sincronizarCliente(db, cobranca.customer);
      return;
    }
    default:
      return; // outros eventos não alteram o acesso
  }
}
