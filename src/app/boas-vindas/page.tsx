'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { WatchtowerHero, TowerMark } from '@/components/brand/Watchtower';
import { SeasonSelector } from '@/components/seasons/SeasonCard';
import { Field } from '@/components/ui/Field';
import { PORTALS, formatHora, type PortalId } from '@/lib/content/portals';
import type { SeasonId } from '@/lib/content/seasons';
import { CATEGORIAS, type Categoria } from '@/lib/store/schema';
import { useStore } from '@/lib/store/provider';

const PASSOS = ['Boas-vindas', 'O propósito', 'Minha estação', 'Meus horários', 'Meu altar', 'Minha Torre'];

export default function Onboarding() {
  const store = useStore();
  const router = useRouter();
  const [passo, setPasso] = useState(0);
  const [nome, setNome] = useState('');
  const [estacao, setEstacao] = useState<SeasonId>();
  const [portais, setPortais] = useState<PortalId[]>([]);
  const [pedido, setPedido] = useState({ titulo: '', categoria: 'Vida espiritual' as Categoria });

  const avancar = () => setPasso((p) => Math.min(p + 1, PASSOS.length - 1));

  function concluir() {
    store.setPreferences({ nome: nome.trim(), portaisAtivos: portais, onboardingConcluido: true });
    if (estacao) store.escolherEstacao(estacao);
    if (pedido.titulo.trim()) store.criarPedido({ titulo: pedido.titulo.trim(), categoria: pedido.categoria, estacao, prioritario: true });
    router.replace('/');
  }

  const toggle = (id: PortalId) => setPortais((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col [padding-top:env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex gap-1.5" aria-label={`Etapa ${passo + 1} de ${PASSOS.length}: ${PASSOS[passo]}`}>
          {PASSOS.map((_, i) => <span key={i} className={clsx('h-1 rounded-full transition-all', i <= passo ? 'w-6 bg-ouro' : 'w-3 bg-line/30')} />)}
        </div>
        {passo < PASSOS.length - 1 && (
          <button onClick={passo === 0 ? concluir : avancar} className="min-h-11 px-2 text-sm text-muted underline-offset-4 hover:underline">
            {passo === 0 ? 'Configurar depois' : 'Pular'}
          </button>
        )}
      </div>

      <div key={passo} className="flex flex-1 flex-col px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 animate-fade-up">
        {passo === 0 && (
          <>
            <div className="-mx-5 overflow-hidden"><WatchtowerHero className="h-[300px] w-full" /></div>
            <div className="-mt-8 text-center">
              <h1 className="font-display text-[34px] uppercase leading-none tracking-[0.06em] text-ouro">Sentinelas</h1>
              <p className="mt-1 font-display text-lg uppercase tracking-[0.3em] text-ouro-300">— da Estação —</p>
              <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-muted">Desperte. Vigie. Ore. Permaneça.</p>
            </div>
            <div className="mt-8"><Field label="Como você gostaria de ser chamada? (opcional)" htmlFor="nome">
              <input id="nome" className="field" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} autoComplete="given-name" />
            </Field></div>
          </>
        )}

        {passo === 1 && (
          <Bloco eyebrow="O propósito" titulo="Uma torre para vigiar a vida com Deus">
            <p>Este aplicativo organiza sua jornada em cinco movimentos: <strong>Palavra</strong>, <strong>oração</strong>, <strong>discernimento</strong>, <strong>fidelidade</strong> e <strong>propósito</strong>.</p>
            <p>Ele não fala em nome de Deus nem mede santidade. É um lugar quieto para você registrar, orar e permanecer.</p>
            <p className="text-sm text-muted">Método de Naiara de Medeiros.</p>
          </Bloco>
        )}

        {passo === 2 && (
          <Bloco eyebrow="Minha estação" titulo="Em que estação você está?">
            <p className="text-[15px]">As estações são metáforas devocionais. Escolha a que mais conversa com este momento — você pode revisar depois.</p>
            <div className="not-prose mt-4"><SeasonSelector valor={estacao} onChange={setEstacao} /></div>
          </Bloco>
        )}

        {passo === 3 && (
          <Bloco eyebrow="Meus horários" titulo="Escolha seus portais de oração">
            <p className="text-[15px]">Comece com um, três ou até os oito. Os horários organizam sua rotina; eles não têm poder em si mesmos.</p>
            <div className="mt-3 flex gap-2">
              {[['1 portal', ['alvorada']], ['3 portais', ['alvorada', 'santidade', 'silencio']], ['Todos os 8', PORTALS.map((p) => p.id)]].map(([l, ids]) => (
                <button key={l as string} onClick={() => setPortais(ids as PortalId[])} className="min-h-10 rounded-full border border-line/40 px-3 text-[13px] hover:bg-surface-2">{l as string}</button>
              ))}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {PORTALS.map((p) => {
                const on = portais.includes(p.id);
                return (
                  <li key={p.id}>
                    <button onClick={() => toggle(p.id)} aria-pressed={on}
                      className={clsx('w-full rounded-xl border px-3 py-3 text-left transition', on ? 'border-ouro bg-ouro/15' : 'border-line/20 bg-surface')}>
                      <span className="block font-display text-lg">{formatHora(p.hora)}</span>
                      <span className="block text-[13px]">{p.nome}</span>
                      <span className="block text-[12px] text-accent">{p.proposito}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted">{portais.length} de 8 selecionados</p>
          </Bloco>
        )}

        {passo === 4 && (
          <Bloco eyebrow="Meu altar" titulo="Registre seu primeiro pedido">
            <p className="text-[15px]">Seu altar é privado. Ninguém além de você vê estes pedidos.</p>
            <div className="mt-4 space-y-4">
              <Field label="Pedido" htmlFor="pedido"><input id="pedido" className="field" placeholder="Ex.: sabedoria nas decisões" value={pedido.titulo} maxLength={120}
                onChange={(e) => setPedido({ ...pedido, titulo: e.target.value })} /></Field>
              <Field label="Categoria" htmlFor="cat"><select id="cat" className="field" value={pedido.categoria} onChange={(e) => setPedido({ ...pedido, categoria: e.target.value as Categoria })}>
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select></Field>
            </div>
          </Bloco>
        )}

        {passo === 5 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <TowerMark className="h-28 w-20" />
            <h2 className="mt-6 font-display text-[28px]">Sua torre está pronta</h2>
            <p className="mt-3 max-w-xs font-serif text-muted">Tudo o que você escolheu pode ser ajustado depois, em Estações, Vigílias e Configurações.</p>
          </div>
        )}

        <div className="mt-auto pt-8">
          {passo < PASSOS.length - 1
            ? <button className="btn-primary w-full" onClick={avancar}>{passo === 0 ? 'Começar' : 'Continuar'}</button>
            : <button className="btn-primary w-full" onClick={concluir}>Entrar na Minha Torre</button>}
          {passo > 0 && <button className="mt-2 min-h-11 w-full text-sm text-muted" onClick={() => setPasso(passo - 1)}>Voltar</button>}
        </div>
      </div>
    </div>
  );
}

function Bloco({ eyebrow, titulo, children }: { eyebrow: string; titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 font-display text-[28px] leading-tight">{titulo}</h1>
      <div className="mt-4 space-y-3 font-serif text-[16px] leading-relaxed text-fg/90">{children}</div>
    </section>
  );
}
