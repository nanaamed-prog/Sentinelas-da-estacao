'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Check, ChevronDown, RotateCcw, Route } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/states';
import { ConfirmationDialog } from '@/components/ui/Sheet';
import { ScriptureReference } from '@/components/ui/ScriptureReference';
import { JourneyProgress } from '@/components/journey/JourneyProgress';
import { JORNADA, PROGRAMA_TITULO, type DiaJornada } from '@/lib/content/journey';
import { useDB, useStore } from '@/lib/store/provider';
import type { JornadaCiclo } from '@/lib/store/schema';
import { dataCurta } from '@/lib/utils/format';

export default function Jornada() {
  const db = useDB();
  const store = useStore();
  const atual = [...db.jornada].sort((a, b) => b.ciclo - a.ciclo)[0];
  const anteriores = db.jornada.filter((c) => c !== atual).sort((a, b) => b.ciclo - a.ciclo);
  const concluidos = new Set(atual?.dias.filter((d) => d.concluidoEm).map((d) => d.dia));
  const proximo = JORNADA.find((d) => !concluidos.has(d.dia))?.dia;
  const [aberto, setAberto] = useState<number | undefined>(proximo);
  const [reiniciar, setReiniciar] = useState(false);
  const completa = concluidos.size === JORNADA.length;

  return (
    <>
      <PageHeader eyebrow="Minha Jornada" titulo={PROGRAMA_TITULO}>Sete dias para firmar a sua caminhada de Palavra, oração e discernimento.</PageHeader>

      {!atual ? (
        <EmptyState icone={<Route size={34} strokeWidth={1.3} />} titulo="Comece quando quiser"
          texto="Um dia de cada vez, no seu ritmo. Se um dia ficar para trás, é só continuar de onde parou."
          acao={<button className="btn-primary" onClick={() => { store.iniciarJornada(); setAberto(1); }}>Começar a jornada</button>} />
      ) : (
        <>
          <div className="card mb-4 p-4">
            <p className="eyebrow">{atual.ciclo > 1 ? `Ciclo ${atual.ciclo} · ` : ''}desde {dataCurta(atual.iniciadoEm)}</p>
            <div className="mt-3"><JourneyProgress ciclo={atual} /></div>
            {completa && (
              <div className="mt-4 rounded-xl bg-ouro/15 p-3">
                <p className="font-display text-lg">Jornada concluída</p>
                <p className="mt-1 font-serif text-[14px] text-muted">Continue subindo à torre todos os dias. Você pode refazer o plano quando sentir necessidade.</p>
              </div>
            )}
          </div>

          <ol className="space-y-2.5">
            {JORNADA.map((d) => (
              <li key={d.dia}>
                <Dia d={d} ciclo={atual} aberto={aberto === d.dia} onToggle={() => setAberto(aberto === d.dia ? undefined : d.dia)}
                  onConcluir={() => { const prox = JORNADA.find((x) => x.dia > d.dia && !concluidos.has(x.dia)); setAberto(prox?.dia); }} />
              </li>
            ))}
          </ol>

          <button className="btn-ghost mt-6 w-full" onClick={() => setReiniciar(true)}><RotateCcw size={16} /> Reiniciar o plano</button>

          {anteriores.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg">Ciclos anteriores</h2>
              <ul className="mt-3 space-y-2">
                {anteriores.map((c) => (
                  <li key={c.ciclo} className="card p-4">
                    <p className="text-[13px]">Ciclo {c.ciclo} · iniciado em {dataCurta(c.iniciadoEm)}</p>
                    <div className="mt-2"><JourneyProgress ciclo={c} /></div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <ConfirmationDialog open={reiniciar} onClose={() => setReiniciar(false)} titulo="Reiniciar o plano?" confirmar="Reiniciar"
        texto="Um novo ciclo começa do Dia 1. Seus registros deste ciclo continuam guardados no histórico."
        onConfirm={() => { store.iniciarJornada(true); setAberto(1); }} />
    </>
  );
}

function Dia({ d, ciclo, aberto, onToggle, onConcluir }: { d: DiaJornada; ciclo: JornadaCiclo; aberto: boolean; onToggle: () => void; onConcluir: () => void }) {
  const store = useStore();
  const salvo = ciclo.dias.find((x) => x.dia === d.dia);
  const feito = !!salvo?.concluidoEm;
  const [texto, setTexto] = useState(salvo?.registro ?? '');
  const [salvando, setSalvando] = useState(false);

  // salvamento automático do registro do dia
  useEffect(() => {
    if (texto === (salvo?.registro ?? '')) return;
    setSalvando(true);
    const t = setTimeout(() => { store.registrarDia(d.dia, texto); setSalvando(false); }, 700);
    return () => clearTimeout(t);
  }, [texto, salvo?.registro, d.dia, store]);

  return (
    <article className={clsx('card overflow-hidden', aberto && 'ring-1 ring-ouro/60')}>
      <button onClick={onToggle} aria-expanded={aberto} className="flex w-full items-center gap-4 p-4 text-left">
        <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-full border font-display',
          feito ? 'border-ouro bg-ouro text-noite' : 'border-line/40 text-accent')}>
          {feito ? <Check size={18} /> : d.dia}
        </span>
        <span className="flex-1">
          <span className="block text-[12px] text-accent">Dia {d.dia}</span>
          <span className="block font-serif text-[16px] leading-snug">{d.titulo}</span>
        </span>
        <ChevronDown size={18} className={clsx('text-muted transition', aberto && 'rotate-180')} />
      </button>

      {aberto && (
        <div className="space-y-4 px-4 pb-5">
          <p className="font-serif text-[15px] leading-relaxed">{d.explicacao}</p>
          <div className="rounded-xl bg-surface-2/60 p-3"><ScriptureReference referencia={d.leitura} rotulo="Leitura bíblica" /></div>
          <div>
            <p className="eyebrow">Reflexão</p>
            <p className="mt-1 font-serif italic">{d.reflexao}</p>
          </div>
          <div>
            <p className="eyebrow">Exercício</p>
            <p className="mt-1 font-serif">{d.exercicio}</p>
            {d.acao && <Link href={d.acao.href} className="mt-2 inline-flex min-h-10 items-center rounded-full border border-line/40 px-4 text-[13px]">{d.acao.rotulo}</Link>}
          </div>
          <div>
            <label htmlFor={`reg-${d.dia}`} className="eyebrow">Meu registro</label>
            <textarea id={`reg-${d.dia}`} rows={5} className="field mt-2 font-serif" placeholder="Escreva o que você percebeu hoje." value={texto} onChange={(e) => setTexto(e.target.value)} />
            <p className="mt-1 text-[12px] text-muted">{salvando ? 'Salvando…' : 'Salvo automaticamente.'}</p>
          </div>
          {feito ? (
            <button className="min-h-11 w-full text-sm text-muted" onClick={() => store.reabrirDia(d.dia)}>Marcar como não concluído</button>
          ) : (
            <button className="btn-primary w-full" onClick={() => { if (texto !== (salvo?.registro ?? '')) store.registrarDia(d.dia, texto); store.concluirDia(d.dia); onConcluir(); }}>
              <Check size={18} /> Concluir o Dia {d.dia}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
