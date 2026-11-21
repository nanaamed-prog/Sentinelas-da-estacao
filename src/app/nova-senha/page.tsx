'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field } from '@/components/ui/Field';
import { getSupabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/provider';
import { LoadingState } from '@/components/ui/states';

export default function NovaSenha() {
  const sb = getSupabase();
  const { session, pronto } = useAuth();
  const router = useRouter();
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [erro, setErro] = useState<string>();
  const [ok, setOk] = useState(false);

  if (!pronto) return <LoadingState />;
  if (!session) return (
    <div className="mx-auto max-w-md px-5 py-16 text-center">
      <h1 className="font-display text-2xl">Link expirado</h1>
      <p className="mt-3 font-serif text-muted">Peça um novo link em “Esqueci minha senha”.</p>
      <button className="btn-primary mt-6" onClick={() => router.replace('/entrar/')}>Voltar</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-display text-[28px]">Criar nova senha</h1>
      <form className="mt-6 space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        if (s1.length < 8) return setErro('A senha precisa ter pelo menos 8 caracteres.');
        if (s1 !== s2) return setErro('As senhas não são iguais.');
        const { error } = await sb!.auth.updateUser({ password: s1 });
        if (error) return setErro('Não foi possível salvar. Peça um novo link.');
        setOk(true); setTimeout(() => router.replace('/'), 1500);
      }}>
        <Field label="Nova senha" htmlFor="s1"><input id="s1" type="password" autoComplete="new-password" className="field" value={s1} onChange={(e) => { setS1(e.target.value); setErro(undefined); }} /></Field>
        <Field label="Repita a nova senha" htmlFor="s2" erro={erro}><input id="s2" type="password" autoComplete="new-password" className="field" value={s2} onChange={(e) => { setS2(e.target.value); setErro(undefined); }} /></Field>
        <button className="btn-primary w-full" type="submit">{ok ? 'Senha salva ✓' : 'Salvar nova senha'}</button>
      </form>
    </div>
  );
}
