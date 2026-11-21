'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { z } from 'zod';
import { TowerMark } from '@/components/brand/Watchtower';
import { Field } from '@/components/ui/Field';
import { getSupabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/provider';

const VERSAO_PRIVACIDADE = '2026-11';
const email = z.string().trim().email('Informe um e-mail válido');
const senha = z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres');
type Modo = 'entrar' | 'criar' | 'esqueci';

/** Mensagens do Supabase traduzidas, sem expor detalhes técnicos. */
function traduzir(m: string): string {
  const s = m.toLowerCase();
  if (s.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (s.includes('email not confirmed')) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (s.includes('already registered') || s.includes('already been registered')) return 'Este e-mail já tem conta. Use “Entrar”.';
  if (s.includes('rate limit') || s.includes('too many')) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (s.includes('fetch') || s.includes('network')) return 'Sem conexão. Verifique sua internet.';
  return 'Não foi possível concluir agora. Tente novamente.';
}

export default function Entrar() {
  const sb = getSupabase();
  const { session } = useAuth();
  const router = useRouter();
  const [modo, setModo] = useState<Modo>('entrar');
  const [f, setF] = useState({ nome: '', email: '', senha: '', aceite: false });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string }>();
  const [carregando, setCarregando] = useState(false);

  useEffect(() => { if (session) router.replace('/'); }, [session, router]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!sb) return;
    setMsg(undefined);
    const er: Record<string, string> = {};
    const em = email.safeParse(f.email); if (!em.success) er.email = em.error.issues[0].message;
    if (modo !== 'esqueci') { const se = senha.safeParse(f.senha); if (!se.success) er.senha = se.error.issues[0].message; }
    if (modo === 'criar' && !f.aceite) er.aceite = 'É preciso aceitar a Política de Privacidade.';
    setErros(er);
    if (Object.keys(er).length) return;
    setCarregando(true);
    try {
      if (modo === 'entrar') {
        const { error } = await sb.auth.signInWithPassword({ email: f.email.trim(), password: f.senha });
        if (error) throw error;
      } else if (modo === 'criar') {
        const { data, error } = await sb.auth.signUp({
          email: f.email.trim(), password: f.senha,
          options: { data: { nome: f.nome.trim().slice(0, 60), aceite_privacidade: VERSAO_PRIVACIDADE }, emailRedirectTo: `${location.origin}/` },
        });
        if (error) throw error;
        if (!data.session) setMsg({ tipo: 'ok', texto: 'Conta criada! Enviamos um link de confirmação para o seu e-mail.' });
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(f.email.trim(), { redirectTo: `${location.origin}/nova-senha/` });
        if (error) throw error;
        setMsg({ tipo: 'ok', texto: 'Se este e-mail tiver conta, enviamos um link para criar uma nova senha.' });
      }
    } catch (err) {
      setMsg({ tipo: 'erro', texto: traduzir(err instanceof Error ? err.message : String(err)) });
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 [padding-top:calc(env(safe-area-inset-top)+2.5rem)]">
      <div className="text-center">
        <TowerMark className="mx-auto h-24 w-16" />
        <h1 className="mt-4 font-display text-[30px] uppercase tracking-[0.06em] text-ouro">Sentinelas</h1>
        <p className="font-display text-sm uppercase tracking-[0.3em] text-ouro-300">— da Estação —</p>
      </div>

      {modo !== 'esqueci' && (
        <div role="tablist" className="mt-8 grid grid-cols-2 rounded-full border border-line/25 p-1">
          {(['entrar', 'criar'] as const).map((m) => (
            <button key={m} role="tab" aria-selected={modo === m} onClick={() => { setModo(m); setMsg(undefined); setErros({}); }}
              className={clsx('min-h-10 rounded-full text-[14px] font-medium', modo === m ? 'bg-ouro text-noite' : 'text-muted')}>
              {m === 'entrar' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>
      )}
      {modo === 'esqueci' && <h2 className="mt-8 font-display text-xl">Recuperar senha</h2>}

      <form className="mt-6 space-y-4" onSubmit={enviar} noValidate>
        {modo === 'criar' && (
          <Field label="Como gostaria de ser chamada? (opcional)" htmlFor="nome">
            <input id="nome" className="field" autoComplete="given-name" maxLength={60} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </Field>
        )}
        <Field label="E-mail" htmlFor="email" erro={erros.email}>
          <input id="email" type="email" inputMode="email" autoComplete="email" className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        {modo !== 'esqueci' && (
          <Field label="Senha" htmlFor="senha" erro={erros.senha} hint={modo === 'criar' ? 'Mínimo de 8 caracteres.' : undefined}>
            <input id="senha" type="password" autoComplete={modo === 'criar' ? 'new-password' : 'current-password'} className="field" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} />
          </Field>
        )}
        {modo === 'criar' && (
          <div>
            <label className="flex items-start gap-3 text-[14px]">
              <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#C58B42]" checked={f.aceite} onChange={(e) => setF({ ...f, aceite: e.target.checked })} />
              <span>Li e aceito a <Link href="/privacidade/" className="text-accent underline">Política de Privacidade</Link>.</span>
            </label>
            {erros.aceite && <p className="mt-1 text-xs text-[#E79A8F]" role="alert">{erros.aceite}</p>}
          </div>
        )}
        {msg && <p role="status" className={clsx('rounded-xl px-4 py-3 text-[14px]', msg.tipo === 'ok' ? 'bg-ouro/15 text-fg' : 'bg-vinho/40 text-marfim')}>{msg.texto}</p>}
        <button className="btn-primary w-full" disabled={carregando} type="submit">
          {carregando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar minha conta' : 'Enviar link'}
        </button>
      </form>

      <div className="mt-4 text-center text-[14px]">
        {modo === 'entrar' && <button className="min-h-11 text-muted underline-offset-4 hover:underline" onClick={() => { setModo('esqueci'); setMsg(undefined); }}>Esqueci minha senha</button>}
        {modo === 'esqueci' && <button className="min-h-11 text-muted underline-offset-4 hover:underline" onClick={() => { setModo('entrar'); setMsg(undefined); }}>Voltar para entrar</button>}
      </div>
      <p className="mt-auto pt-10 text-center font-display text-[11px] uppercase tracking-[0.22em] text-muted">Desperte. Vigie. Ore. Permaneça.</p>
    </div>
  );
}
