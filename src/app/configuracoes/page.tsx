'use client';
import { useState } from 'react';
import clsx from 'clsx';
import { Download, Copy, Trash2, ShieldCheck, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/provider';
import { PageHeader } from '@/components/ui/states';
import { ConfirmationDialog, Sheet } from '@/components/ui/Sheet';
import { Field } from '@/components/ui/Field';
import { useDB, useStore } from '@/lib/store/provider';
import { useRouter } from 'next/navigation';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

export default function Configuracoes() {
  const db = useDB();
  const store = useStore();
  const router = useRouter();
  const [nome, setNome] = useState(db.preferencias.nome);
  const [msg, setMsg] = useState<string>();
  const [apagar, setApagar] = useState(false);
  const auth = useAuth();
  const nuvem = auth.configurado && !!auth.session;
  const [excluirConta, setExcluirConta] = useState(false);
  const [confirmacao, setConfirmacao] = useState('');
  const aviso = (m: string) => { setMsg(m); setTimeout(() => setMsg(undefined), 2500); };

  function baixar() {
    try {
      const blob = new Blob([store.exportar()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sentinelas-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch { aviso('Não foi possível baixar aqui. Use "Copiar".'); }
  }
  async function copiar() {
    try { await navigator.clipboard.writeText(store.exportar()); aviso('Dados copiados.'); } catch { aviso('Não foi possível copiar neste navegador.'); }
  }

  return (
    <>
      <PageHeader eyebrow="Preferências" titulo="Configurações" />
      <div className="space-y-6">
        <InstallPrompt />
        <section className="card space-y-4 p-4">
          <Field label="Como você gostaria de ser chamada?" htmlFor="nome">
            <input id="nome" className="field" value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} onBlur={() => store.setPreferences({ nome: nome.trim() })} />
          </Field>
          <div>
            <p className="text-[13px] font-medium text-muted">Tema visual</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([['noite', 'Noite', 'bg-noite'], ['pergaminho', 'Pergaminho', 'bg-pergaminho']] as const).map(([k, l, bg]) => (
                <button key={k} onClick={() => store.setPreferences({ tema: k })} aria-pressed={db.preferencias.tema === k}
                  className={clsx('flex min-h-12 items-center gap-3 rounded-xl border px-3', db.preferencias.tema === k ? 'border-ouro ring-1 ring-ouro' : 'border-line/30')}>
                  <span className={clsx('h-6 w-6 rounded-full border border-line/40', bg)} /> {l}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="card space-y-3 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-accent" size={20} />
            <p className="font-serif text-[14px] text-muted">
              {nuvem
                ? <>Seus registros ficam salvos na sua conta e só você tem acesso. <Link href="/privacidade/" className="text-accent underline">Política de Privacidade</Link>.</>
                : <>Neste modo, seus dados ficam <strong className="text-fg">somente neste aparelho</strong>, no armazenamento do navegador. Nada é enviado para servidores.</>}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={baixar}><Download size={16} /> Exportar</button>
            <button className="btn-ghost" onClick={copiar}><Copy size={16} /> Copiar</button>
          </div>
          {msg && <p role="status" className="text-center text-[13px] text-accent">{msg}</p>}
        </section>

        {nuvem ? (
          <section id="conta" className="card space-y-3 p-4">
            <p className="eyebrow">Minha conta</p>
            <p className="text-[15px]">{auth.email}</p>
            <button className="btn-ghost w-full" onClick={() => void auth.sair()}><LogOut size={16} /> Sair desta conta</button>
            <button className="btn w-full border border-vinho/70 text-[#E79A8F]" onClick={() => setExcluirConta(true)}><Trash2 size={16} /> Excluir minha conta</button>
          </section>
        ) : (
          <section className="card p-4">
            <button className="btn w-full border border-vinho/70 text-[#E79A8F]" onClick={() => setApagar(true)}><Trash2 size={16} /> Apagar todos os meus dados</button>
          </section>
        )}

        <p className="text-center text-[12px] text-muted">Sentinelas da Estação · v0.1 (Fase 1)<br />Método de Naiara de Medeiros</p>
      </div>

      <Sheet open={excluirConta} onClose={() => { setExcluirConta(false); setConfirmacao(''); }} titulo="Excluir minha conta">
        <p className="font-serif text-[15px] text-muted">
          Sua conta e <strong className="text-fg">todos</strong> os seus registros — pedidos, testemunhos, diário, vigílias e estações — serão apagados
          definitivamente. Isso não pode ser desfeito. Exporte antes se quiser guardar uma cópia.
        </p>
        <Field label='Para confirmar, escreva EXCLUIR' htmlFor="conf">
          <input id="conf" className="field mt-1" autoCapitalize="characters" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
        </Field>
        <button className="btn mt-5 w-full bg-vinho text-marfim disabled:opacity-40" disabled={confirmacao.trim().toUpperCase() !== 'EXCLUIR'}
          onClick={async () => {
            try { await auth.excluirConta(); router.replace('/entrar/'); }
            catch { aviso('Não foi possível excluir agora. Verifique a conexão e tente de novo.'); setExcluirConta(false); }
          }}>Excluir definitivamente</button>
      </Sheet>

      <ConfirmationDialog open={apagar} onClose={() => setApagar(false)} perigo titulo="Apagar tudo?" confirmar="Apagar definitivamente"
        texto="Estações, vigílias, pedidos e diário serão apagados deste aparelho. Exporte antes se quiser guardar uma cópia."
        onConfirm={() => { store.apagarTudo(); router.replace('/boas-vindas/'); }} />
    </>
  );
}
