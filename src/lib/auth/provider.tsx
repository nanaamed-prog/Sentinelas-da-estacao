'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, supabaseConfigurado } from '@/lib/supabase/client';
import { useStore } from '@/lib/store/provider';
import { SyncEngine, type SyncStatus } from '@/lib/sync/engine';
import type { StorageAdapter } from '@/lib/store/store';
import { removerTudo } from '@/lib/attachments/anexos';

const DONO = 'sentinelas:dono';
const disco = (uid: string): StorageAdapter => {
  const k = `sentinelas:fila:${uid}`;
  return {
    read() { try { return localStorage.getItem(k); } catch { return null; } },
    write(v) { try { localStorage.setItem(k, v); } catch { /* noop */ } },
    clear() { try { localStorage.removeItem(k); } catch { /* noop */ } },
  };
};
const lerDono = () => { try { return localStorage.getItem(DONO); } catch { return null; } };
const gravarDono = (v: string | null) => { try { v ? localStorage.setItem(DONO, v) : localStorage.removeItem(DONO); } catch { /* noop */ } };

interface AuthCtx {
  configurado: boolean;
  pronto: boolean;
  session: Session | null;
  email?: string;
  sync: SyncStatus;
  recuperandoSenha: boolean;
  /** dados da conta já carregados do servidor (ou falhou e seguimos com os locais) */
  carregado: boolean;
  sair: () => Promise<void>;
  excluirConta: () => Promise<void>;
  /** envia agora o que estiver pendente (ex.: antes de anexar arquivos a um registro novo) */
  sincronizarAgora: () => Promise<void>;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const sb = getSupabase();
  const [pronto, setPronto] = useState(!supabaseConfigurado);
  const [session, setSession] = useState<Session | null>(null);
  const [sync, setSync] = useState<SyncStatus>('sincronizado');
  const [recuperandoSenha, setRecuperando] = useState(false);
  const [carregado, setCarregado] = useState(!supabaseConfigurado);
  const engine = useRef<SyncEngine | null>(null);
  const uidAtual = useRef<string | null>(null);

  useEffect(() => {
    if (!sb) return;
    const iniciarSync = (s: Session | null) => {
      const uid = s?.user.id ?? null;
      if (uid === uidAtual.current) return;
      engine.current?.parar();
      engine.current = null;
      uidAtual.current = uid;
      if (!uid) { setCarregado(true); return; }
      setCarregado(false);
      // dados deixados por outra conta neste aparelho nunca são misturados
      const dono = lerDono();
      if (dono && dono !== uid) store.apagarTudo();
      gravarDono(uid);
      const e = new SyncEngine(sb, uid, store, disco(uid));
      engine.current = e;
      e.onStatus(setSync);
      void e.iniciar().finally(() => setCarregado(true));
    };
    sb.auth.getSession().then(({ data }) => { setSession(data.session); iniciarSync(data.session); setPronto(true); });
    const { data } = sb.auth.onAuthStateChange((ev, s) => {
      if (ev === 'PASSWORD_RECOVERY') setRecuperando(true);
      if (ev === 'USER_UPDATED') setRecuperando(false);
      setSession(s);
      iniciarSync(s);
    });
    return () => { data.subscription.unsubscribe(); engine.current?.parar(); };
  }, [sb, store]);

  async function limparAparelho(uid?: string) {
    engine.current?.parar();
    engine.current = null;
    uidAtual.current = null;
    if (uid) disco(uid).clear();
    gravarDono(null);
    store.apagarTudo();
  }

  const value: AuthCtx = {
    configurado: supabaseConfigurado,
    pronto,
    session,
    email: session?.user.email,
    sync,
    recuperandoSenha,
    carregado,
    async sair() {
      if (!sb) return;
      // privacidade: ao sair, nada fica salvo neste aparelho (exceto envios pendentes, que são perdidos se houver)
      await engine.current?.flush();
      const uid = session?.user.id;
      await sb.auth.signOut();
      await limparAparelho(uid);
    },
    async sincronizarAgora() { await engine.current?.flush(); },
    async excluirConta() {
      if (!sb) return;
      // assinatura renovando: o provedor continuaria cobrando — pedir o cancelamento antes de apagar qualquer coisa
      const { data: renovando } = await sb.from('assinaturas').select('id').eq('provedor', 'stripe')
        .in('status', ['pendente', 'ativa', 'em_atraso']).eq('cancelar_no_fim', false).limit(1);
      if (renovando?.length) throw new Error('assinatura_renovando');
      if (session?.user.id) await removerTudo(sb, session.user.id).catch(() => undefined);
      const { error } = await sb.rpc('excluir_minha_conta');
      if (error) throw new Error(error.message);
      const uid = session?.user.id;
      await sb.auth.signOut({ scope: 'local' });
      await limparAparelho(uid);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fora do AuthProvider');
  return c;
}
