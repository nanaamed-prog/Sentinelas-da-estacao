import { uid } from '@/lib/utils/format';
import type { PortalId } from '@/lib/content/portals';
import type { SeasonId } from '@/lib/content/seasons';
import {
  dbSchema, emptyDB, journalEntrySchema, prayerRequestSchema, preferencesSchema,
  type DB, type JornadaCiclo, type JournalEntry, type Preferences, type PrayerRequest, type PrayerSession,
  type SeasonRecord, type Status,
} from './schema';

/**
 * Repositório local (Fase 1). Mantém os dados SOMENTE neste aparelho.
 * A Fase 2 troca o adaptador por Supabase (com RLS) mantendo a mesma API.
 */
export interface StorageAdapter {
  read(): string | null;
  write(value: string): void;
  clear(): void;
}

const KEY = 'sentinelas:v1';

export const browserStorage: StorageAdapter = {
  read() { try { return localStorage.getItem(KEY); } catch { return null; } },
  write(v) { try { localStorage.setItem(KEY, v); } catch { /* armazenamento indisponível */ } },
  clear() { try { localStorage.removeItem(KEY); } catch { /* noop */ } },
};

export function memoryStorage(initial: string | null = null): StorageAdapter {
  let v = initial;
  return { read: () => v, write: (x) => { v = x; }, clear: () => { v = null; } };
}

const now = () => new Date().toISOString();

export class Store {
  private db: DB;
  private listeners = new Set<() => void>();
  private changeListeners = new Set<(prev: DB, next: DB) => void>();

  constructor(private storage: StorageAdapter) {
    this.db = this.load();
  }

  private load(): DB {
    const raw = this.storage.read();
    if (!raw) return emptyDB();
    try {
      const parsed = dbSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : emptyDB();
    } catch {
      return emptyDB();
    }
  }

  private commit(next: DB) {
    const prev = this.db;
    this.db = next;
    this.changeListeners.forEach((l) => l(prev, next));
    this.storage.write(JSON.stringify(next));
    this.listeners.forEach((l) => l());
  }

  /** Recebe cada alteração (antes/depois) — usado pela sincronização. */
  onChange(l: (prev: DB, next: DB) => void) { this.changeListeners.add(l); return () => { this.changeListeners.delete(l); }; }

  /** Substitui todos os dados sem disparar sincronização (ex.: dados vindos do servidor). */
  replaceAll(db: DB) {
    this.db = db;
    this.storage.write(JSON.stringify(db));
    this.listeners.forEach((l) => l());
  }

  subscribe = (l: () => void) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };
  getSnapshot = () => this.db;

  // ---------- Preferências ----------
  setPreferences(patch: Partial<Preferences>) {
    const preferencias = preferencesSchema.parse({ ...this.db.preferencias, ...patch });
    this.commit({ ...this.db, preferencias });
  }

  // ---------- Estações ----------
  get estacaoAtual(): SeasonRecord | undefined {
    return this.db.estacoes.find((e) => !e.fim);
  }

  escolherEstacao(estacao: SeasonId, dados: Partial<Pick<SeasonRecord, 'motivos' | 'reflexao' | 'desafios' | 'atitudes' | 'inicio'>> = {}) {
    const t = now();
    // encerra a anterior, preservando o histórico
    const estacoes = this.db.estacoes.map((e) => (e.fim ? e : { ...e, fim: t, atualizadoEm: t }));
    const rec: SeasonRecord = {
      id: uid(), estacao, inicio: dados.inicio ?? t, motivos: dados.motivos ?? '', reflexao: dados.reflexao ?? '',
      desafios: dados.desafios ?? '', atitudes: dados.atitudes ?? '', criadoEm: t, atualizadoEm: t,
    };
    this.commit({ ...this.db, estacoes: [rec, ...estacoes] });
    return rec;
  }

  revisarEstacao(id: string, patch: Partial<Pick<SeasonRecord, 'motivos' | 'reflexao' | 'desafios' | 'atitudes'>>) {
    this.commit({ ...this.db, estacoes: this.db.estacoes.map((e) => (e.id === id ? { ...e, ...patch, atualizadoEm: now() } : e)) });
  }

  // ---------- Portais / vigílias ----------
  togglePortal(id: PortalId) {
    const a = this.db.preferencias.portaisAtivos;
    this.setPreferences({ portaisAtivos: a.includes(id) ? a.filter((x) => x !== id) : [...a, id] });
  }

  get vigiliaEmAndamento(): PrayerSession | undefined {
    return this.db.vigilias.find((v) => !v.fim);
  }

  iniciarVigilia(portal: PortalId): PrayerSession {
    const aberta = this.vigiliaEmAndamento;
    if (aberta) return aberta;
    const s: PrayerSession = { id: uid(), portal, inicio: now(), oracaoPessoal: '', pedidos: [] };
    this.commit({ ...this.db, vigilias: [s, ...this.db.vigilias] });
    return s;
  }

  atualizarVigilia(id: string, patch: Partial<Pick<PrayerSession, 'oracaoPessoal' | 'pedidos'>>) {
    this.commit({ ...this.db, vigilias: this.db.vigilias.map((v) => (v.id === id ? { ...v, ...patch } : v)) });
  }

  concluirVigilia(id: string) {
    this.commit({ ...this.db, vigilias: this.db.vigilias.map((v) => (v.id === id ? { ...v, fim: now() } : v)) });
  }

  cancelarVigilia(id: string) {
    this.commit({ ...this.db, vigilias: this.db.vigilias.filter((v) => v.id !== id) });
  }

  // ---------- Altar ----------
  criarPedido(input: Partial<PrayerRequest> & { titulo: string }): PrayerRequest {
    const t = now();
    const pedido = prayerRequestSchema.parse({
      ...input, id: uid(), criadoEm: t, atualizadoEm: t,
      historico: [{ id: uid(), em: t, tipo: 'criado' }],
    });
    this.commit({ ...this.db, pedidos: [pedido, ...this.db.pedidos] });
    return pedido;
  }

  editarPedido(id: string, patch: Partial<Omit<PrayerRequest, 'id' | 'historico' | 'criadoEm'>>) {
    this.commit({
      ...this.db,
      pedidos: this.db.pedidos.map((p) => (p.id === id ? prayerRequestSchema.parse({ ...p, ...patch, atualizadoEm: now() }) : p)),
    });
  }

  mudarStatus(id: string, status: Status, testemunho?: string) {
    const t = now();
    this.commit({
      ...this.db,
      pedidos: this.db.pedidos.map((p) => p.id !== id ? p : {
        ...p, status, atualizadoEm: t,
        respondidoEm: status === 'Respondido' ? (p.respondidoEm ?? t) : p.respondidoEm,
        testemunho: testemunho ?? p.testemunho,
        historico: [...p.historico, { id: uid(), em: t, tipo: 'status' as const, status }],
      }),
    });
  }

  /** Recalibrar: o pedido original é preservado; cria-se nova entrada no histórico. */
  recalibrar(id: string, r: { oQueMudou: string; oQuePermanece: string; novaNecessidade: string; atitude: string }) {
    const t = now();
    this.commit({
      ...this.db,
      pedidos: this.db.pedidos.map((p) => p.id !== id ? p : {
        ...p, atualizadoEm: t, historico: [...p.historico, { id: uid(), em: t, tipo: 'recalibrado' as const, ...r }],
      }),
    });
  }

  excluirPedido(id: string) {
    this.commit({ ...this.db, pedidos: this.db.pedidos.filter((p) => p.id !== id) });
  }

  get pedidoPrioritario(): PrayerRequest | undefined {
    const abertos = this.db.pedidos.filter((p) => p.status === 'Em oração' || p.status === 'Em acompanhamento');
    return abertos.find((p) => p.prioritario) ?? abertos[0];
  }

  // ---------- Diário ----------
  salvarRegistro(input: Partial<JournalEntry> & { titulo: string }): JournalEntry {
    const t = now();
    if (input.id) {
      const atual = this.db.diario.find((d) => d.id === input.id);
      if (atual) {
        const e = journalEntrySchema.parse({ ...atual, ...input, atualizadoEm: t });
        this.commit({ ...this.db, diario: this.db.diario.map((d) => (d.id === e.id ? e : d)) });
        return e;
      }
    }
    const e = journalEntrySchema.parse({ data: t, ...input, id: uid(), criadoEm: t, atualizadoEm: t });
    this.commit({ ...this.db, diario: [e, ...this.db.diario] });
    return e;
  }

  favoritar(id: string) {
    this.commit({ ...this.db, diario: this.db.diario.map((d) => (d.id === id ? { ...d, favorito: !d.favorito } : d)) });
  }

  excluirRegistro(id: string) {
    this.commit({ ...this.db, diario: this.db.diario.filter((d) => d.id !== id) });
  }

  // ---------- Jornada (plano de sete dias) ----------
  get jornadaAtual(): JornadaCiclo | undefined {
    return [...this.db.jornada].sort((a, b) => b.ciclo - a.ciclo)[0];
  }

  /** Começa a jornada (ou um novo ciclo, se reiniciar). Ciclos anteriores são preservados. */
  iniciarJornada(reiniciar = false): JornadaCiclo {
    const atual = this.jornadaAtual;
    if (atual && !reiniciar) return atual;
    const novo: JornadaCiclo = { ciclo: (atual?.ciclo ?? 0) + 1, iniciadoEm: now(), dias: [{ dia: 1, registro: '' }] };
    this.commit({ ...this.db, jornada: [...this.db.jornada, novo] });
    return novo;
  }

  private alterarDia(dia: number, patch: { registro?: string; concluidoEm?: string | undefined }) {
    const atual = this.jornadaAtual ?? this.iniciarJornada();
    const existe = atual.dias.some((d) => d.dia === dia);
    const dias = existe
      ? atual.dias.map((d) => (d.dia === dia ? { ...d, ...patch } : d))
      : [...atual.dias, { dia, registro: '', ...patch }].sort((a, b) => a.dia - b.dia);
    const novo = { ...atual, dias };
    this.commit({ ...this.db, jornada: this.db.jornada.map((c) => (c.ciclo === atual.ciclo ? novo : c)) });
  }

  registrarDia(dia: number, registro: string) { this.alterarDia(dia, { registro }); }
  concluirDia(dia: number) { this.alterarDia(dia, { concluidoEm: now() }); }
  reabrirDia(dia: number) { this.alterarDia(dia, { concluidoEm: undefined }); }

  // ---------- Dados ----------
  exportar(): string {
    return JSON.stringify({ exportadoEm: now(), app: 'Sentinelas da Estação', ...this.db }, null, 2);
  }

  apagarTudo() {
    this.storage.clear();
    this.db = emptyDB();
    this.listeners.forEach((l) => l());
  }
}
