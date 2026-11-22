'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth/provider';
import { chamar } from '@/lib/assinatura/buscar';
import { PLANOS_PADRAO, type Plano, type PlanoId } from './planos';

export interface AssinaturaAtual {
  id: string; provedor: 'stripe' | 'cortesia'; plano_id: PlanoId | null;
  status: 'pendente' | 'ativa' | 'em_atraso' | 'suspensa' | 'pausada' | 'cancelada' | 'expirada';
  periodo_inicio: string | null; periodo_fim: string | null; cancelar_no_fim: boolean; cancelada_em: string | null;
}
export interface Situacao {
  ativas: boolean; completo: boolean; logada: boolean; checkout: boolean; modoTeste: boolean;
  planos: Plano[]; assinatura: AssinaturaAtual | null; contestacao: boolean;
}

/** Sem servidor (ou antes da primeira resposta): assinaturas desligadas, tudo liberado — como antes. */
export const SITUACAO_PADRAO: Situacao = { ativas: false, completo: true, logada: false, checkout: false, modoTeste: false, planos: PLANOS_PADRAO, assinatura: null, contestacao: false };

const chave = (uid: string | null) => `sentinelas:assinatura:${uid ?? 'anon'}`;

/**
 * Situação guardada para uso sem internet. O acesso completo guardado só vale até o fim do período pago
 * (a confirmação de verdade é sempre do servidor; isto apenas evita bloquear quem está offline).
 */
export function situacaoGuardada(uid: string | null, agora = Date.now()): Situacao | null {
  try {
    const s = JSON.parse(localStorage.getItem(chave(uid)) ?? 'null') as (Situacao & { em: number }) | null;
    if (!s) return null;
    if (s.ativas && s.completo) {
      const fim = s.assinatura?.periodo_fim ? Date.parse(s.assinatura.periodo_fim) + 86_400_000 : s.em + 3 * 86_400_000;
      if (agora > fim) return { ...s, completo: false };
    }
    return s;
  } catch { return null; }
}

interface Ctx extends Situacao {
  carregado: boolean;
  token: string | null;
  recarregar: () => Promise<void>;
  /** abre o checkout do provedor; devolve mensagem de erro, se houver */
  assinar: (plano: PlanoId, voltar: string) => Promise<string | null>;
  abrirPortal: () => Promise<string | null>;
  alterarRenovacao: (acao: 'cancelar' | 'reativar') => Promise<string | null>;
  sincronizar: () => Promise<void>;
}
const C = createContext<Ctx | null>(null);

export function AssinaturaProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  const token = session?.access_token ?? null;
  const [s, setS] = useState<Situacao>(SITUACAO_PADRAO);
  const [carregado, setCarregado] = useState(false);

  const recarregar = useCallback(async () => {
    try {
      const r = await chamar<Situacao>('/api/assinatura', token);
      if (r.ok && typeof r.dados.completo === 'boolean') {
        setS(r.dados);
        try { localStorage.setItem(chave(uid), JSON.stringify({ ...r.dados, em: Date.now() })); } catch { /* noop */ }
      }
    } catch {
      const g = situacaoGuardada(uid);
      if (g) setS(g);
    } finally { setCarregado(true); }
  }, [token, uid]);

  useEffect(() => {
    const g = situacaoGuardada(uid);
    if (g) setS(g);
    void recarregar();
  }, [recarregar, uid]);

  const assinar = useCallback(async (plano: PlanoId, voltar: string) => {
    if (!s.logada) return 'Entre na sua conta para assinar.';
    try {
      const r = await chamar<{ url?: string; erro?: string }>('/api/assinatura/checkout', token, { metodo: 'POST', corpo: { plano, voltar } });
      if (r.ok && r.dados.url) { window.location.assign(r.dados.url); return null; }
      return r.dados.erro ?? 'Não foi possível abrir o pagamento agora.';
    } catch { return 'Sem conexão. Tente novamente quando estiver online.'; }
  }, [token, s.logada]);

  const abrirPortal = useCallback(async () => {
    try {
      const r = await chamar<{ url?: string; erro?: string }>('/api/assinatura/portal', token, { metodo: 'POST', corpo: {} });
      if (r.ok && r.dados.url) { window.location.assign(r.dados.url); return null; }
      return r.dados.erro ?? 'Não foi possível abrir o gerenciamento agora.';
    } catch { return 'Sem conexão. Tente novamente quando estiver online.'; }
  }, [token]);

  const alterarRenovacao = useCallback(async (acao: 'cancelar' | 'reativar') => {
    try {
      const r = await chamar<{ ok?: boolean; erro?: string }>('/api/assinatura/cancelar', token, { metodo: 'POST', corpo: { acao } });
      await recarregar();
      return r.ok ? null : (r.dados.erro ?? 'Não foi possível concluir agora.');
    } catch { return 'Sem conexão. Nada foi alterado.'; }
  }, [token, recarregar]);

  const sincronizar = useCallback(async () => {
    try { await chamar('/api/assinatura/sincronizar', token, { metodo: 'POST', corpo: {} }); } catch { /* offline */ }
    await recarregar();
  }, [token, recarregar]);

  const v = useMemo(() => ({ ...s, carregado, token, recarregar, assinar, abrirPortal, alterarRenovacao, sincronizar }),
    [s, carregado, token, recarregar, assinar, abrirPortal, alterarRenovacao, sincronizar]);
  return <C.Provider value={v}>{children}</C.Provider>;
}

export function useAssinatura(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error('useAssinatura fora do AssinaturaProvider');
  return c;
}

type EstadoConteudo = 'carregando' | 'ok' | 'bloqueado' | 'indisponivel';

/**
 * Conteúdo entregue pelo servidor (biblioteca, orações). Fica guardado no aparelho para leitura offline
 * apenas enquanto o acesso estiver válido.
 */
export function useConteudo<T extends { completo?: boolean }>(tipo: 'biblioteca' | 'oracoes'): { dados: T | null; estado: EstadoConteudo } {
  const { token, completo, carregado } = useAssinatura();
  const { session } = useAuth();
  const k = `sentinelas:conteudo:${tipo}:${session?.user.id ?? 'anon'}`;
  const [dados, setDados] = useState<T | null>(null);
  const [estado, setEstado] = useState<EstadoConteudo>('carregando');

  useEffect(() => {
    let vivo = true;
    let guardado: T | null = null;
    try { guardado = JSON.parse(localStorage.getItem(k) ?? 'null'); } catch { /* noop */ }
    // conteúdo completo guardado não vale para quem não tem mais acesso
    if (guardado && guardado.completo && !completo) { guardado = null; try { localStorage.removeItem(k); } catch { /* noop */ } }
    if (guardado) { setDados(guardado); setEstado('ok'); }
    if (!carregado) return;
    chamar<T & { erro?: string }>(`/api/conteudo/${tipo}`, token).then((r) => {
      if (!vivo) return;
      if (r.ok) {
        setDados(r.dados); setEstado('ok');
        try { localStorage.setItem(k, JSON.stringify(r.dados)); } catch { /* noop */ }
      } else if (r.status === 403) { setDados(null); setEstado('bloqueado'); try { localStorage.removeItem(k); } catch { /* noop */ } }
      else if (!guardado) setEstado('indisponivel');
    }).catch(() => { if (vivo && !guardado) setEstado('indisponivel'); });
    return () => { vivo = false; };
  }, [tipo, token, completo, carregado, k]);

  return { dados, estado };
}
