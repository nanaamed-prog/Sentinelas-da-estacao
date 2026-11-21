import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Store, memoryStorage } from '@/lib/store/store';
import { SyncEngine } from '@/lib/sync/engine';
import { diff, pullAll } from '@/lib/sync/remote';
import { emptyDB } from '@/lib/store/schema';

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Supabase em memória, só com o necessário para a sincronização. */
function fakeSupabase(opts: { falhar?: () => boolean } = {}) {
  const tabelas: Record<string, any[]> = {};
  const chamadas: string[] = [];
  const pk = (t: string) => (t === 'user_preferences' ? ['user_id'] : t === 'user_portal_settings' ? ['user_id', 'portal_id'] : ['id']);
  const res = (data: any) => (opts.falhar?.() ? { data: null, error: { message: 'Failed to fetch' } } : { data, error: null });
  const from = (t: string) => {
    const rows = (tabelas[t] ??= []);
    const filtros: [string, any][] = [];
    const q: any = {
      upsert(v: any) {
        chamadas.push(`upsert:${t}`);
        const r = res(null); if (r.error) return Promise.resolve(r);
        for (const row of Array.isArray(v) ? v : [v]) {
          const k = pk(t); const i = rows.findIndex((x) => k.every((c) => x[c] === row[c]));
          if (i >= 0) rows[i] = { ...rows[i], ...row }; else rows.push({ created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...row });
        }
        return Promise.resolve(r);
      },
      update(v: any) { return { eq: (c: string, val: any) => { chamadas.push(`update:${t}`); const r = res(null); if (!r.error) rows.filter((x) => x[c] === val).forEach((x) => Object.assign(x, v)); return Promise.resolve(r); } }; },
      delete() { return { eq: (c: string, val: any) => { chamadas.push(`delete:${t}`); const r = res(null); if (!r.error) tabelas[t] = rows.filter((x) => x[c] !== val); return Promise.resolve(r); } }; },
      select() { return q; },
      eq(c: string, v: any) { filtros.push([c, v]); return q; },
      order() { return q; },
      maybeSingle() { return Promise.resolve(res(rows.filter((x) => filtros.every(([c, v]) => x[c] === v))[0] ?? null)); },
      then(ok: any, no: any) { return Promise.resolve(res(rows.filter((x) => filtros.every(([c, v]) => x[c] === v)))).then(ok, no); },
    };
    return q;
  };
  return { sb: { from } as unknown as SupabaseClient, tabelas, chamadas };
}

const UID = '11111111-1111-4111-8111-111111111111';

describe('sincronização', () => {
  it('diff gera operações só do que mudou, fechando estação antiga antes de abrir a nova', () => {
    const s = new Store(memoryStorage());
    s.escolherEstacao('inverno');
    const antes = s.getSnapshot();
    s.escolherEstacao('primavera');
    const ops = diff(antes, s.getSnapshot());
    expect(ops.map((o) => o.t)).toEqual(['estacao', 'estacao']);
    expect((ops[0] as any).rec.fim).toBeTruthy();
    expect((ops[1] as any).rec.estacao).toBe('primavera');
  });

  it('envia alterações e reconstrói os mesmos dados ao buscar do servidor', async () => {
    const { sb } = fakeSupabase();
    const store = new Store(memoryStorage());
    const eng = new SyncEngine(sb, UID, store, memoryStorage());
    await eng.iniciar();
    store.setPreferences({ nome: 'Naiara', onboardingConcluido: true, portaisAtivos: ['alvorada', 'silencio'] });
    store.escolherEstacao('outono', { motivos: 'poda' });
    const p = store.criarPedido({ titulo: 'Sabedoria nas decisões', pessoaOuAssunto: 'eu' });
    store.recalibrar(p.id, { oQueMudou: 'a', oQuePermanece: 'b', novaNecessidade: 'c', atitude: 'd' });
    store.mudarStatus(p.id, 'Respondido', 'Deus abriu uma porta');
    const v = store.iniciarVigilia('alvorada'); store.concluirVigilia(v.id);
    store.salvarRegistro({ titulo: 'Gratidão', tipo: 'Gratidão', texto: 'x' });
    await eng.flush();
    expect(eng.pendentes).toBe(0);

    const remoto = await pullAll(sb, UID);
    expect(remoto.preferencias).toMatchObject({ onboardingConcluido: true });
    expect(remoto.preferencias.portaisAtivos.sort()).toEqual(['alvorada', 'silencio']);
    expect(remoto.estacoes[0]).toMatchObject({ estacao: 'outono', motivos: 'poda' });
    expect(remoto.pedidos[0]).toMatchObject({ titulo: 'Sabedoria nas decisões', status: 'Respondido', testemunho: 'Deus abriu uma porta' });
    expect(remoto.pedidos[0].historico.map((h) => h.tipo)).toEqual(['criado', 'recalibrado', 'status']);
    expect(remoto.vigilias[0].fim).toBeTruthy();
    expect(remoto.diario[0].titulo).toBe('Gratidão');
    eng.parar();
  });

  it('sem internet guarda na fila e envia quando a conexão volta', async () => {
    let online = false;
    const fila = memoryStorage();
    const { sb, tabelas } = fakeSupabase({ falhar: () => !online });
    const store = new Store(memoryStorage());
    const eng = new SyncEngine(sb, UID, store, fila, () => online);
    await eng.iniciar();
    store.criarPedido({ titulo: 'Família' });
    await eng.flush();
    expect(eng.pendentes).toBeGreaterThan(0);
    expect(JSON.parse(fila.read()!)).toHaveLength(eng.pendentes); // fila persiste no aparelho
    expect(tabelas.prayer_requests ?? []).toHaveLength(0);
    online = true;
    await eng.flush();
    expect(eng.pendentes).toBe(0);
    expect(tabelas.prayer_requests).toHaveLength(1);
    eng.parar();
  });

  it('primeiro login: registros feitos no aparelho sobem para a conta vazia', async () => {
    const { sb, tabelas } = fakeSupabase();
    const store = new Store(memoryStorage());
    store.setPreferences({ onboardingConcluido: true });
    store.criarPedido({ titulo: 'Antes da conta' });
    const eng = new SyncEngine(sb, UID, store, memoryStorage());
    await eng.iniciar();
    await eng.flush();
    expect(tabelas.prayer_requests.map((r) => r.titulo)).toEqual(['Antes da conta']);
    eng.parar();
  });

  it('conta com dados: o servidor prevalece sobre o aparelho', async () => {
    const { sb } = fakeSupabase();
    const a = new Store(memoryStorage());
    const e1 = new SyncEngine(sb, UID, a, memoryStorage());
    await e1.iniciar(); a.setPreferences({ onboardingConcluido: true }); a.criarPedido({ titulo: 'Do servidor' }); await e1.flush(); e1.parar();

    const b = new Store(memoryStorage());
    const e2 = new SyncEngine(sb, UID, b, memoryStorage());
    await e2.iniciar();
    expect(b.getSnapshot().pedidos.map((p) => p.titulo)).toEqual(['Do servidor']);
    e2.parar();
  });

  it('excluir pedido remove do servidor', async () => {
    const { sb, tabelas } = fakeSupabase();
    const store = new Store(memoryStorage());
    const eng = new SyncEngine(sb, UID, store, memoryStorage());
    await eng.iniciar();
    const p = store.criarPedido({ titulo: 'Temporário' }); await eng.flush();
    store.excluirPedido(p.id); await eng.flush();
    expect(tabelas.prayer_requests).toHaveLength(0);
    const e = emptyDB(); expect(diff(e, e)).toEqual([]);
    eng.parar();
  });
});
