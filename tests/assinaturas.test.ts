import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { assinarWebhook, assinaturaDaFatura, codificar, mapearStatus, normalizar, webhookAutentico } from '@/lib/assinatura/stripe';
import { caminhoSeguro, precoPorExtenso, PLANOS_PADRAO, RECURSOS_COMPLETO, RECURSOS } from '@/lib/assinatura/planos';
import { processarEvento } from '@/lib/assinatura/eventos';

describe('preços e textos', () => {
  it('mostra o valor total e a periodicidade; o anual nunca aparece como mensal', () => {
    const [m, a] = PLANOS_PADRAO;
    expect(precoPorExtenso(m)).toBe('R$ 19,90 por mês, renovação automática mensal');
    expect(precoPorExtenso(a)).toBe('R$ 197,00 por ano, cobrados de uma vez, renovação automática anual');
    expect(precoPorExtenso(a)).not.toMatch(/mês/);
  });
  it('não oferece atendimento pessoal, mentoria ou comunidade', () => {
    const tudo = RECURSOS_COMPLETO.map((r) => RECURSOS[r].nome + RECURSOS[r].beneficio).join(' ');
    expect(tudo).not.toMatch(/mentoria|comunidade|atendimento/i);
  });
  it('retorno apenas para caminhos internos', () => {
    expect(caminhoSeguro('/altar/')).toBe('/altar/');
    expect(caminhoSeguro('//evil.com')).toBe('/');
    expect(caminhoSeguro('https://evil.com')).toBe('/');
    expect(caminhoSeguro('/\\evil')).toBe('/');
    expect(caminhoSeguro(null, '/planos/')).toBe('/planos/');
  });
});

describe('Stripe', () => {
  const segredo = 'whsec_teste';
  const corpo = JSON.stringify({ id: 'evt_1', type: 'invoice.paid' });
  it('webhook: aceita assinatura válida e recusa adulterada, antiga ou ausente', () => {
    const agora = 1_800_000_000;
    expect(webhookAutentico(corpo, assinarWebhook(corpo, segredo, agora), segredo, agora)).toBe(true);
    expect(webhookAutentico(corpo + ' ', assinarWebhook(corpo, segredo, agora), segredo, agora)).toBe(false);
    expect(webhookAutentico(corpo, assinarWebhook(corpo, 'outro', agora), segredo, agora)).toBe(false);
    expect(webhookAutentico(corpo, assinarWebhook(corpo, segredo, agora - 600), segredo, agora)).toBe(false);
    expect(webhookAutentico(corpo, null, segredo, agora)).toBe(false);
    expect(webhookAutentico(corpo, 't=abc,v1=00', segredo, agora)).toBe(false);
  });
  it('codifica parâmetros aninhados', () => {
    expect(decodeURIComponent(codificar({ mode: 'subscription', line_items: [{ price: 'price_1', quantity: 1 }], subscription_data: { metadata: { user_id: 'u' } }, x: undefined })))
      .toBe('mode=subscription&line_items[0][price]=price_1&line_items[0][quantity]=1&subscription_data[metadata][user_id]=u');
  });
  it('situações do provedor', () => {
    expect(['active', 'trialing', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid', 'paused', 'canceled'].map(mapearStatus))
      .toEqual(['ativa', 'ativa', 'em_atraso', 'pendente', 'expirada', 'suspensa', 'pausada', 'cancelada']);
  });
  it('lê o período nos itens (versão basil) e na assinatura (versões antigas)', () => {
    const base = { id: 'sub_1', status: 'active', customer: 'cus_1', metadata: { user_id: 'u1' } };
    const n = normalizar({ ...base, cancel_at_period_end: true, items: { data: [{ price: { id: 'price_m' }, current_period_start: 1_800_000_000, current_period_end: 1_802_592_000 }] } });
    expect(n).toMatchObject({ cliente_id: 'cus_1', user_id: 'u1', preco_id: 'price_m', status: 'ativa', cancelar_no_fim: true, periodo_fim: new Date(1_802_592_000_000).toISOString() });
    expect(normalizar({ ...base, current_period_end: 1_802_592_000 }).periodo_fim).toBe(new Date(1_802_592_000_000).toISOString());
  });
  it('assinatura da fatura nos dois formatos', () => {
    expect(assinaturaDaFatura({ parent: { subscription_details: { subscription: 'sub_novo' } } })).toBe('sub_novo');
    expect(assinaturaDaFatura({ subscription: 'sub_antigo' })).toBe('sub_antigo');
    expect(assinaturaDaFatura({})).toBeNull();
  });
});

/** banco falso com o mínimo usado pelos eventos */
function bancoFalso(clientes: Record<string, string>) {
  const gravadas: Record<string, unknown>[] = [];
  const atualizacoes: Record<string, unknown>[] = [];
  const db = {
    gravadas, atualizacoes,
    rpc: async (nome: string, args: { a: Record<string, unknown> }) => { if (nome === 'gravar_assinatura') gravadas.push(args.a); return { data: 1, error: null }; },
    from: (tabela: string) => {
      const q = {
        filtros: {} as Record<string, string>,
        select() { return q; }, update(v: Record<string, unknown>) { atualizacoes.push({ tabela, ...v }); return q; },
        eq(k: string, v: string) { q.filtros[k] = v; return q; },
        async maybeSingle() {
          if (tabela === 'clientes_pagamento') { const uid = clientes[q.filtros.provedor_cliente_id]; return { data: uid ? { user_id: uid } : null }; }
          if (tabela === 'planos') return { data: q.filtros.provedor_preco_id === 'price_anual' ? { id: 'anual' } : null };
          return { data: null };
        },
        then(r: (v: unknown) => void) { r({ data: null, error: null }); },
      };
      return q;
    },
  };
  return db;
}

describe('eventos do provedor', () => {
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.STRIPE_SECRET_KEY; });
  const sub = (status: string, extra: Record<string, unknown> = {}) => ({
    id: 'sub_9', status, customer: 'cus_9', metadata: { user_id: 'uid-9' },
    items: { data: [{ price: { id: 'price_anual' }, current_period_start: 1_800_000_000, current_period_end: 1_831_536_000 }] }, ...extra,
  });
  function stripeFalso(respostas: Record<string, unknown>) {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    const chamadas: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      const chave = `${init.method} ${url.replace('https://api.stripe.com/v1', '').split('?')[0]}`;
      chamadas.push(chave);
      return new Response(JSON.stringify(respostas[chave] ?? {}), { status: 200 });
    }));
    return chamadas;
  }

  it('não confia no conteúdo do evento: relê a assinatura no provedor', async () => {
    const chamadas = stripeFalso({ 'GET /subscriptions/sub_9': sub('active') });
    const db = bancoFalso({ cus_9: 'uid-9' });
    // o evento diz "canceled", mas o provedor diz "active" agora: vale o provedor
    await processarEvento(db as never, { id: 'evt', type: 'customer.subscription.updated', created: 1, data: { object: { id: 'sub_9', status: 'canceled' } } });
    expect(chamadas).toEqual(['GET /subscriptions/sub_9']);
    expect(db.gravadas[0]).toMatchObject({ user_id: 'uid-9', status: 'ativa', plano_id: 'anual' });
  });

  it('pagamento confirmado após checkout libera a trava e grava', async () => {
    stripeFalso({ 'GET /subscriptions/sub_9': sub('active') });
    const db = bancoFalso({ cus_9: 'uid-9' });
    await processarEvento(db as never, { id: 'e', type: 'checkout.session.completed', created: 1, data: { object: { id: 'cs_1', customer: 'cus_9', subscription: 'sub_9', client_reference_id: 'uid-9' } } });
    expect(db.atualizacoes[0]).toMatchObject({ tabela: 'clientes_pagamento', checkout_sessao_id: null });
    expect(db.gravadas).toHaveLength(1);
  });

  it('falha de pagamento e renovação passam pela fatura', async () => {
    stripeFalso({ 'GET /subscriptions/sub_9': sub('past_due') });
    const db = bancoFalso({ cus_9: 'uid-9' });
    await processarEvento(db as never, { id: 'e', type: 'invoice.payment_failed', created: 1, data: { object: { parent: { subscription_details: { subscription: 'sub_9' } } } } });
    expect(db.gravadas[0]).toMatchObject({ status: 'em_atraso' });
  });

  it('cliente desconhecido com metadados de outra pessoa não é gravado', async () => {
    stripeFalso({ 'GET /subscriptions/sub_9': sub('active', { metadata: { user_id: 'intrusa' } }) });
    const db = bancoFalso({ cus_9: 'uid-9' });
    await processarEvento(db as never, { id: 'e', type: 'customer.subscription.created', created: 1, data: { object: { id: 'sub_9' } } });
    expect(db.gravadas).toHaveLength(0);
  });

  it('reembolso total encerra a assinatura no provedor', async () => {
    const chamadas = stripeFalso({ 'GET /subscriptions': { data: [sub('active')] }, 'DELETE /subscriptions/sub_9': sub('canceled') });
    const db = bancoFalso({ cus_9: 'uid-9' });
    await processarEvento(db as never, { id: 'e', type: 'charge.refunded', created: 1, data: { object: { id: 'ch_1', customer: 'cus_9', amount: 1990, amount_refunded: 1990 } } });
    expect(chamadas).toContain('DELETE /subscriptions/sub_9');
  });

  it('reembolso parcial não encerra', async () => {
    const chamadas = stripeFalso({ 'GET /subscriptions': { data: [sub('active')] } });
    await processarEvento(bancoFalso({ cus_9: 'uid-9' }) as never, { id: 'e', type: 'charge.refunded', created: 1, data: { object: { id: 'ch_1', customer: 'cus_9', amount: 1990, amount_refunded: 500 } } });
    expect(chamadas).not.toContain('DELETE /subscriptions/sub_9');
  });

  it('contestação aberta suspende; encerrada devolve', async () => {
    stripeFalso({ 'GET /charges/ch_1': { customer: 'cus_9' }, 'GET /subscriptions': { data: [] } });
    const db = bancoFalso({ cus_9: 'uid-9' });
    await processarEvento(db as never, { id: 'e', type: 'charge.dispute.created', created: 1, data: { object: { charge: 'ch_1' } } });
    await processarEvento(db as never, { id: 'e2', type: 'charge.dispute.closed', created: 2, data: { object: { charge: 'ch_1', status: 'won' } } });
    expect(db.atualizacoes.map((u) => u.contestacao_aberta)).toEqual([true, false]);
  });
});

describe('conteúdo pago fica no servidor', () => {
  const arquivos = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = path.join(d, f); return statSync(p).isDirectory() ? arquivos(p) : [p]; });
  it('nenhum componente do navegador importa src/lib/conteudo-pago', () => {
    const src = path.join(__dirname, '..', 'src');
    const culpados = arquivos(src).filter((f) => /\.(tsx?|jsx?)$/.test(f) && !f.includes(`${path.sep}api${path.sep}`) && !f.includes('conteudo-pago'))
      .filter((f) => /from ['"][^'"]*conteudo-pago/.test(readFileSync(f, 'utf8')));
    expect(culpados).toEqual([]);
  });
  it('a chave secreta só é lida no servidor', () => {
    const src = path.join(__dirname, '..', 'src');
    const usos = arquivos(src).filter((f) => /STRIPE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|STRIPE_WEBHOOK_SECRET/.test(readFileSync(f, 'utf8')))
      .map((f) => path.relative(src, f));
    expect(usos.every((f) => f.startsWith(`lib${path.sep}assinatura`) || f.startsWith(`app${path.sep}api`))).toBe(true);
    for (const f of usos) expect(readFileSync(path.join(src, f), 'utf8')).not.toMatch(/^'use client'/);
  });
});
