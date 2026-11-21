import type { SupabaseClient } from '@supabase/supabase-js';
import type { Store, StorageAdapter } from '@/lib/store/store';
import { emptyDB } from '@/lib/store/schema';
import { applyOp, diff, opKey, pullAll, vazio, type Op } from './remote';

export type SyncStatus = 'sincronizado' | 'pendente' | 'sincronizando' | 'offline' | 'erro';

/**
 * Sincronização segura: toda alteração local vira uma operação numa fila (outbox) guardada no aparelho.
 * A fila é enviada em ordem; sem conexão, ela espera e é reenviada quando a internet volta.
 */
export class SyncEngine {
  private fila: Op[] = [];
  private emCurso: Promise<void> | null = null;
  private tentativa = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private status: SyncStatus = 'sincronizado';
  private ouvintes = new Set<(s: SyncStatus) => void>();
  private soltar: (() => void) | null = null;
  private ultimoErro = '';

  constructor(
    private sb: SupabaseClient,
    private uid: string,
    private store: Store,
    private disco: StorageAdapter,
    private online: () => boolean = () => (typeof navigator === 'undefined' ? true : navigator.onLine),
  ) {
    try { this.fila = JSON.parse(disco.read() ?? '[]'); } catch { this.fila = []; }
  }

  onStatus(l: (s: SyncStatus) => void) { this.ouvintes.add(l); l(this.status); return () => { this.ouvintes.delete(l); }; }
  get erro() { return this.ultimoErro; }
  get pendentes() { return this.fila.length; }

  private set(s: SyncStatus) { this.status = s; this.ouvintes.forEach((l) => l(s)); }
  private salvarFila() { this.disco.write(JSON.stringify(this.fila)); }

  enfileirar(ops: Op[]) {
    for (const op of ops) {
      const k = opKey(op);
      this.fila = this.fila.filter((x) => opKey(x) !== k);
      this.fila.push(op);
    }
    this.salvarFila();
    if (this.fila.length) this.set(this.online() ? 'pendente' : 'offline');
    void this.flush();
  }

  /** Entrar: busca o servidor. Se o servidor está vazio e o aparelho tem registros, envia os do aparelho. */
  async iniciar() {
    this.set('sincronizando');
    // envia o que ficou pendente de outra sessão antes de buscar
    this.soltar = this.store.onChange((a, b) => this.enfileirar(diff(a, b)));
    if (typeof window !== 'undefined') window.addEventListener('online', this.aoVoltar);
    await this.flush();
    try {
      const remoto = await pullAll(this.sb, this.uid);
      const local = this.store.getSnapshot();
      if (vazio(remoto) && !vazio(local)) this.enfileirar(diff(emptyDB(), local));
      else if (!this.fila.length) this.store.replaceAll(remoto);
      if (!this.fila.length) this.set('sincronizado');
    } catch (e) {
      // sem conexão: continua com os dados do aparelho e tenta de novo depois
      this.ultimoErro = e instanceof Error ? e.message : String(e);
      this.set(this.online() ? 'erro' : 'offline');
    }
  }

  parar() {
    this.soltar?.();
    this.soltar = null;
    if (this.timer) clearTimeout(this.timer);
    if (typeof window !== 'undefined') window.removeEventListener('online', this.aoVoltar);
  }

  private aoVoltar = () => { this.tentativa = 0; this.ultimoErro = ''; void this.flush(); };

  /** Envia a fila. Se já houver um envio em andamento, espera por ele e continua com o que sobrou. */
  flush(): Promise<void> {
    if (this.emCurso) return this.emCurso.then(() => (this.fila.length && this.online() && this.ultimoErro === '' ? this.flush() : undefined));
    if (!this.fila.length) return Promise.resolve();
    if (!this.online()) { this.set('offline'); return Promise.resolve(); }
    this.emCurso = this.enviar().finally(() => { this.emCurso = null; });
    return this.emCurso;
  }

  private async enviar(): Promise<void> {
    this.set('sincronizando');
    try {
      while (this.fila.length) {
        await applyOp(this.sb, this.uid, this.fila[0]);
        this.fila.shift();
        this.salvarFila();
      }
      this.tentativa = 0;
      this.ultimoErro = '';
      this.set('sincronizado');
    } catch (e) {
      this.ultimoErro = e instanceof Error ? e.message : String(e);
      this.set(this.online() ? 'erro' : 'offline');
      const espera = Math.min(60_000, 2_000 * 2 ** this.tentativa++);
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => { this.ultimoErro = ''; void this.flush(); }, espera);
    }
  }
}
