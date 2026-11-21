'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Flame, NotebookPen, Leaf, HandHeart, RefreshCw, Star, Route } from 'lucide-react';
import { PageHeader } from '@/components/ui/states';
import { useDB, useNow } from '@/lib/store/provider';
import { chaveDia, eventos, gradeDoMes, porDia, ROTULO, type TipoEvento } from '@/lib/calendar/events';

const ICONE: Record<TipoEvento, typeof Flame> = {
  vigilia: Flame, diario: NotebookPen, estacao: Leaf, pedido: HandHeart, recalibracao: RefreshCw, testemunho: Star, jornada: Route,
};
const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function Calendario() {
  const db = useDB();
  const hoje = useNow();
  const [ref, setRef] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [sel, setSel] = useState(() => chaveDia(hoje));
  const mapa = useMemo(() => porDia(eventos(db)), [db]);
  const grade = gradeDoMes(ref.getFullYear(), ref.getMonth());
  const doDia = mapa.get(sel) ?? [];
  const mudar = (n: number) => setRef(new Date(ref.getFullYear(), ref.getMonth() + n, 1));
  const titulo = ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const selData = new Date(sel + 'T12:00:00');

  return (
    <>
      <PageHeader eyebrow="Calendário e histórico" titulo="Calendário">A memória da sua caminhada, dia a dia.</PageHeader>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => mudar(-1)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Mês anterior"><ChevronLeft size={20} /></button>
          <h2 className="font-display text-lg first-letter:uppercase" aria-live="polite">{titulo}</h2>
          <button onClick={() => mudar(1)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Próximo mês"><ChevronRight size={20} /></button>
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted" aria-hidden="true">
          {SEMANA.map((d, i) => <span key={i} className="py-1">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1" aria-label="Dias do mês">
          {grade.map((d, i) => {
            if (!d) return <span key={i} />;
            const k = chaveDia(d);
            const n = mapa.get(k)?.length ?? 0;
            const ehHoje = k === chaveDia(hoje);
            return (
              <button key={i} onClick={() => setSel(k)} aria-pressed={sel === k}
                aria-label={`${d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}${n ? `, ${n} registro${n > 1 ? 's' : ''}` : ''}`}
                className={clsx('relative flex aspect-square flex-col items-center justify-center rounded-xl text-[14px] transition',
                  sel === k ? 'bg-ouro text-noite' : ehHoje ? 'ring-1 ring-ouro' : 'hover:bg-surface-2')}>
                {d.getDate()}
                {n > 0 && <span className={clsx('absolute bottom-1.5 h-1 w-1 rounded-full', sel === k ? 'bg-noite' : 'bg-ouro')} />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg first-letter:uppercase">{selData.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
        {doDia.length === 0 ? (
          <p className="mt-2 font-serif text-[14px] text-muted">Nenhum registro neste dia.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {doDia.map((e, i) => {
              const Icon = ICONE[e.tipo];
              return (
                <li key={i}>
                  <Link href={e.href} className="card flex items-center gap-3 p-3">
                    <Icon size={18} strokeWidth={1.5} className="shrink-0 text-accent" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] text-accent">{ROTULO[e.tipo]} · {new Date(e.quando).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="block truncate font-serif text-[15px]">{e.titulo}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
