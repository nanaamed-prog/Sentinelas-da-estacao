import type { SupabaseClient } from '@supabase/supabase-js';
import { PORTALS, type PortalId } from '@/lib/content/portals';
import { PROGRAMA_ID } from '@/lib/content/journey';
import { emptyDB, preferencesSchema, type DB, type JornadaCiclo, type JournalEntry, type PrayerRequest, type PrayerSession, type SeasonRecord, type Preferences } from '@/lib/store/schema';

/** Operações enviadas ao servidor. Cada uma é idempotente (upsert/delete por id). */
export type Op =
  | { t: 'prefs'; prefs: Preferences }
  | { t: 'estacao'; rec: SeasonRecord }
  | { t: 'vigilia'; s: PrayerSession }
  | { t: 'vigilia-del'; id: string }
  | { t: 'pedido'; p: PrayerRequest }
  | { t: 'pedido-del'; id: string }
  | { t: 'diario'; e: JournalEntry }
  | { t: 'diario-del'; id: string }
  | { t: 'jornada'; c: JornadaCiclo };

export const opKey = (op: Op): string => {
  switch (op.t) {
    case 'prefs': return 'prefs';
    case 'estacao': return `estacao:${op.rec.id}`;
    case 'vigilia': return `vigilia:${op.s.id}`;
    case 'vigilia-del': return `vigilia:${op.id}`;
    case 'pedido': return `pedido:${op.p.id}`;
    case 'pedido-del': return `pedido:${op.id}`;
    case 'diario': return `diario:${op.e.id}`;
    case 'diario-del': return `diario:${op.id}`;
    case 'jornada': return `jornada:${op.c.ciclo}`;
  }
};

/** Compara dois estados e gera as operações necessárias (objetos alterados têm nova referência). */
export function diff(prev: DB, next: DB): Op[] {
  const ops: Op[] = [];
  if (prev.preferencias !== next.preferencias) ops.push({ t: 'prefs', prefs: next.preferencias });

  // estações: as encerradas primeiro (só pode haver uma aberta no banco)
  const estacoes = next.estacoes.filter((e) => !prev.estacoes.includes(e));
  estacoes.sort((a, b) => Number(!a.fim) - Number(!b.fim));
  estacoes.forEach((rec) => ops.push({ t: 'estacao', rec }));

  type Col = 'vigilias' | 'pedidos' | 'diario';
  const col = <K extends Col>(k: K, up: (x: DB[K][number]) => Op, del: (id: string) => Op) => {
    const ids = new Set(next[k].map((x) => x.id));
    // fechamentos/remoções antes de criações (vigília: só uma aberta)
    prev[k].filter((x) => !ids.has(x.id)).forEach((x) => ops.push(del(x.id)));
    const changed = (next[k] as DB[K][number][]).filter((x) => !(prev[k] as DB[K][number][]).includes(x));
    if (k === 'vigilias') changed.sort((a, b) => Number(!(a as PrayerSession).fim) - Number(!(b as PrayerSession).fim));
    changed.forEach((x) => ops.push(up(x)));
  };
  col('vigilias', (s) => ({ t: 'vigilia', s: s as PrayerSession }), (id) => ({ t: 'vigilia-del', id }));
  col('pedidos', (p) => ({ t: 'pedido', p: p as PrayerRequest }), (id) => ({ t: 'pedido-del', id }));
  col('diario', (e) => ({ t: 'diario', e: e as JournalEntry }), (id) => ({ t: 'diario-del', id }));
  (next.jornada ?? []).filter((c) => !(prev.jornada ?? []).includes(c)).forEach((c) => ops.push({ t: 'jornada', c }));
  return ops;
}

const ok = <T>(r: { data: T; error: { message: string } | null }): T => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};

export async function applyOp(sb: SupabaseClient, uid: string, op: Op): Promise<void> {
  switch (op.t) {
    case 'prefs': {
      const p = op.prefs;
      ok(await sb.from('profiles').update({ nome: p.nome }).eq('id', uid));
      ok(await sb.from('user_preferences').upsert({ user_id: uid, tema: p.tema, onboarding_concluido: p.onboardingConcluido, lembretes: p.lembretes }));
      ok(await sb.from('user_portal_settings').upsert(PORTALS.map((pt) => ({ user_id: uid, portal_id: pt.id, ativo: p.portaisAtivos.includes(pt.id) }))));
      return;
    }
    case 'estacao': {
      const r = op.rec;
      ok(await sb.from('season_history').upsert({
        id: r.id, user_id: uid, estacao: r.estacao, inicio: r.inicio, fim: r.fim ?? null,
        motivos: r.motivos, reflexao: r.reflexao, desafios: r.desafios, atitudes: r.atitudes, created_at: r.criadoEm,
      }));
      return;
    }
    case 'vigilia': {
      const s = op.s;
      ok(await sb.from('prayer_sessions').upsert({ id: s.id, user_id: uid, portal_id: s.portal, inicio: s.inicio, fim: s.fim ?? null, oracao_pessoal: s.oracaoPessoal, pedidos: s.pedidos }));
      return;
    }
    case 'vigilia-del': ok(await sb.from('prayer_sessions').delete().eq('id', op.id)); return;
    case 'pedido': {
      const p = op.p;
      ok(await sb.from('prayer_requests').upsert({
        id: p.id, user_id: uid, titulo: p.titulo, descricao: p.descricao, categoria: p.categoria, pessoa_ou_assunto: p.pessoaOuAssunto,
        portal_id: p.portal ?? null, estacao: p.estacao ?? null, prioritario: p.prioritario, status: p.status,
        respondido_em: p.respondidoEm ?? null, created_at: p.criadoEm,
      }));
      if (p.historico.length) {
        ok(await sb.from('prayer_request_updates').upsert(p.historico.map((h) => ({
          id: h.id, user_id: uid, request_id: p.id, tipo: h.tipo, created_at: h.em, status: h.status ?? null,
          o_que_mudou: h.oQueMudou ?? null, o_que_permanece: h.oQuePermanece ?? null, nova_necessidade: h.novaNecessidade ?? null, atitude: h.atitude ?? null,
        }))));
      }
      if (p.testemunho?.trim()) {
        ok(await sb.from('testimonies').upsert({ id: p.id, user_id: uid, request_id: p.id, titulo: p.titulo.slice(0, 140), texto: p.testemunho, data: p.respondidoEm ?? p.atualizadoEm }));
      } else {
        ok(await sb.from('testimonies').delete().eq('id', p.id));
      }
      return;
    }
    case 'pedido-del':
      ok(await sb.from('testimonies').delete().eq('id', op.id));
      ok(await sb.from('prayer_requests').delete().eq('id', op.id));
      return;
    case 'diario': {
      const e = op.e;
      ok(await sb.from('journal_entries').upsert({
        id: e.id, user_id: uid, data: e.data, tipo: e.tipo, titulo: e.titulo, texto: e.texto, referencia: e.referencia,
        estacao: e.estacao ?? null, portal_id: e.portal ?? null, marcadores: e.marcadores, favorito: e.favorito, created_at: e.criadoEm,
      }));
      return;
    }
    case 'diario-del': ok(await sb.from('journal_entries').delete().eq('id', op.id)); return;
    case 'jornada': {
      const c = op.c;
      ok(await sb.from('journey_progress').upsert(c.dias.map((d) => ({
        user_id: uid, program_id: PROGRAMA_ID, ciclo: c.ciclo, dia: d.dia, registro: d.registro,
        concluido_em: d.concluidoEm ?? null, created_at: c.iniciadoEm,
      })), { onConflict: 'user_id,program_id,ciclo,dia' }));
      return;
    }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Busca todos os dados da usuária e monta o estado do app. O RLS garante que só voltam os registros dela. */
export async function pullAll(sb: SupabaseClient, uid: string): Promise<DB> {
  const [perfil, prefs, portais, estacoes, vigilias, pedidos, atualizacoes, testemunhos, diario, jornada] = await Promise.all([
    sb.from('profiles').select('nome').eq('id', uid).maybeSingle(),
    sb.from('user_preferences').select('*').eq('user_id', uid).maybeSingle(),
    sb.from('user_portal_settings').select('portal_id, ativo'),
    sb.from('season_history').select('*').order('inicio', { ascending: false }),
    sb.from('prayer_sessions').select('*').order('inicio', { ascending: false }),
    sb.from('prayer_requests').select('*').order('created_at', { ascending: false }),
    sb.from('prayer_request_updates').select('*').order('created_at', { ascending: true }),
    sb.from('testimonies').select('*'),
    sb.from('journal_entries').select('*').order('data', { ascending: false }),
    sb.from('journey_progress').select('*').eq('program_id', PROGRAMA_ID),
  ]);
  const p: any = ok(prefs as any) ?? {};
  const db = emptyDB();
  db.preferencias = preferencesSchema.parse({
    nome: (ok(perfil as any) as any)?.nome ?? '',
    tema: p.tema ?? 'noite',
    onboardingConcluido: p.onboarding_concluido ?? false,
    lembretes: p.lembretes ?? false,
    portaisAtivos: (ok(portais as any) as any[]).filter((r) => r.ativo).map((r) => r.portal_id as PortalId),
  });
  db.estacoes = (ok(estacoes as any) as any[]).map((r) => ({
    id: r.id, estacao: r.estacao, inicio: r.inicio, fim: r.fim ?? undefined, motivos: r.motivos, reflexao: r.reflexao,
    desafios: r.desafios, atitudes: r.atitudes, criadoEm: r.created_at, atualizadoEm: r.updated_at,
  }));
  db.vigilias = (ok(vigilias as any) as any[]).map((r) => ({
    id: r.id, portal: r.portal_id, inicio: r.inicio, fim: r.fim ?? undefined, oracaoPessoal: r.oracao_pessoal, pedidos: r.pedidos ?? [],
  }));
  const upd = ok(atualizacoes as any) as any[];
  const test = new Map((ok(testemunhos as any) as any[]).map((t) => [t.request_id, t.texto]));
  db.pedidos = (ok(pedidos as any) as any[]).map((r) => ({
    id: r.id, titulo: r.titulo, descricao: r.descricao, categoria: r.categoria, pessoaOuAssunto: r.pessoa_ou_assunto,
    portal: r.portal_id ?? undefined, estacao: r.estacao ?? undefined, prioritario: r.prioritario, status: r.status,
    respondidoEm: r.respondido_em ?? undefined, testemunho: test.get(r.id) ?? undefined,
    criadoEm: r.created_at, atualizadoEm: r.updated_at,
    historico: upd.filter((h) => h.request_id === r.id).map((h) => ({
      id: h.id, em: h.created_at, tipo: h.tipo, status: h.status ?? undefined, oQueMudou: h.o_que_mudou ?? undefined,
      oQuePermanece: h.o_que_permanece ?? undefined, novaNecessidade: h.nova_necessidade ?? undefined, atitude: h.atitude ?? undefined,
    })),
  }));
  db.diario = (ok(diario as any) as any[]).map((r) => ({
    id: r.id, data: r.data, tipo: r.tipo, titulo: r.titulo, texto: r.texto, referencia: r.referencia,
    estacao: r.estacao ?? undefined, portal: r.portal_id ?? undefined, marcadores: r.marcadores ?? [], favorito: r.favorito,
    criadoEm: r.created_at, atualizadoEm: r.updated_at,
  }));
  const ciclos = new Map<number, JornadaCiclo>();
  for (const r of (ok(jornada as any) as any[]) ?? []) {
    const c: JornadaCiclo = ciclos.get(r.ciclo) ?? { ciclo: r.ciclo, iniciadoEm: r.created_at, dias: [] };
    if (r.created_at < c.iniciadoEm) c.iniciadoEm = r.created_at;
    c.dias.push({ dia: r.dia, registro: r.registro ?? '', concluidoEm: r.concluido_em ?? undefined });
    ciclos.set(r.ciclo, c);
  }
  db.jornada = [...ciclos.values()].map((c) => ({ ...c, dias: c.dias.sort((a, b) => a.dia - b.dia) })).sort((a, b) => a.ciclo - b.ciclo);
  return db;
}

/** true se não há nada registrado (servidor novo). */
export const vazio = (db: DB) =>
  !db.preferencias.onboardingConcluido && !db.estacoes.length && !db.pedidos.length && !db.diario.length && !db.vigilias.length && !(db.jornada ?? []).length;
