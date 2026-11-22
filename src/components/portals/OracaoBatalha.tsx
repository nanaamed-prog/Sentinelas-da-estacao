'use client';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Copy, Check, ChevronLeft, ChevronRight, Footprints, Info } from 'lucide-react';
import type { PortalId } from '@/lib/content/portals';
import {
  ALVOS, ENCERRAMENTO, TEMAS, TEMA_DO_PORTAL, montarOracao,
  type AlvoId, type Modalidade, type TemaId,
} from '@/lib/content/batalha';

const MODOS: { id: Modalidade; nome: string }[] = [
  { id: 'breve', nome: 'Breve' }, { id: 'completa', nome: 'Completa' }, { id: 'guiada', nome: 'Guiada' },
];

function Chips<T extends string>({ rotulo, itens, valor, onChange }: { rotulo: string; itens: { id: T; nome: string }[]; valor: T; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="eyebrow">{rotulo}</p>
      <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label={rotulo}>
        {itens.map((i) => (
          <button key={i.id} type="button" onClick={() => onChange(i.id)} aria-pressed={valor === i.id}
            className={clsx('min-h-10 shrink-0 rounded-full border px-3 text-[13px]', valor === i.id ? 'border-ouro bg-ouro text-noite' : 'border-line/30 text-muted')}>
            {i.nome}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface OracaoBatalhaProps {
  portal?: PortalId;
  pedido?: { titulo: string; pessoa?: string };
  temaInicial?: TemaId;
  alvoInicial?: AlvoId;
  /** ações extras; recebe o texto atual da oração */
  acao?: (texto: string) => React.ReactNode;
}

/** Oração de batalha espiritual: tema × alvo da intercessão × modalidade, moldada pelo portal. */
export function OracaoBatalha({ portal, pedido, temaInicial, alvoInicial, acao }: OracaoBatalhaProps) {
  const [tema, setTema] = useState<TemaId>(temaInicial ?? (portal ? TEMA_DO_PORTAL[portal] : 'armadura'));
  const [alvo, setAlvo] = useState<AlvoId>(alvoInicial ?? 'vida');
  const [modo, setModo] = useState<Modalidade>('completa');
  const [passo, setPasso] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const o = useMemo(() => montarOracao({ tema, alvo, modalidade: modo, portal, pedido }), [tema, alvo, modo, portal, pedido]);
  const total = o.etapas.length + 1; // + encerramento
  const copiar = async () => {
    try { await navigator.clipboard.writeText(`${o.texto}\n\n${ENCERRAMENTO.texto}`); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch { /* sem permissão */ }
  };

  return (
    <div className="space-y-4">
      <Chips rotulo="Tema" itens={TEMAS} valor={tema} onChange={(v) => { setTema(v); setPasso(0); }} />
      <Chips rotulo="Intercessão por" itens={ALVOS} valor={alvo} onChange={(v) => { setAlvo(v); setPasso(0); }} />
      <Chips rotulo="Modalidade" itens={MODOS} valor={modo} onChange={(v) => { setModo(v); setPasso(0); }} />

      <article className="leitura rounded-xl px-4 py-4">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C5C22]">{o.tema}</p>
        <h3 className="mt-1 font-display text-lg leading-snug">{o.titulo}</h3>
        <p className="mt-1 font-sans text-[12px] text-[#6B5440]">{o.referencias.join(' · ')}</p>

        {modo === 'breve' && <p className="mt-4 text-[16px] italic">{o.texto}</p>}

        {modo === 'completa' && (
          <ol className="mt-4 space-y-4">
            {o.etapas.map((e, i) => (
              <li key={e.id}>
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C5C22]">{i + 1}. {e.titulo}</p>
                <p className="mt-1 text-[16px] italic">{e.texto}</p>
              </li>
            ))}
          </ol>
        )}

        {modo === 'guiada' && (
          <div className="mt-4" aria-live="polite">
            <p className="font-sans text-[12px] text-[#6B5440]">Passo {passo + 1} de {total}</p>
            {passo < o.etapas.length ? (<>
              <p className="mt-1 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C5C22]">{o.etapas[passo].titulo}</p>
              <p className="mt-1 text-[17px] italic">{o.etapas[passo].texto}</p>
            </>) : (<>
              <p className="mt-1 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C5C22]">{ENCERRAMENTO.titulo}</p>
              <p className="mt-1 text-[17px] italic">{ENCERRAMENTO.texto}</p>
            </>)}
            <p className="mt-3 font-sans text-[12px] text-[#6B5440]">Ore com calma. Avance quando estiver pronta.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" disabled={passo === 0} onClick={() => setPasso((p) => p - 1)}
                className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[#8C5C22]/40 px-3 text-[13px] disabled:opacity-40"><ChevronLeft size={14} /> Voltar</button>
              <button type="button" disabled={passo === total - 1} onClick={() => setPasso((p) => p + 1)}
                className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[#8C5C22] px-4 text-[13px] text-marfim disabled:opacity-40">Próximo <ChevronRight size={14} /></button>
            </div>
          </div>
        )}

        {modo !== 'guiada' && (
          <details className="mt-5 border-t border-[#8C5C22]/20 pt-3">
            <summary className="cursor-pointer font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8C5C22]">{ENCERRAMENTO.titulo}</summary>
            <p className="mt-2 text-[16px] italic">{ENCERRAMENTO.texto}</p>
            <p className="mt-1 font-sans text-[12px] text-[#6B5440]">{ENCERRAMENTO.referencias.join(' · ')}</p>
          </details>
        )}
      </article>

      <div className="card space-y-2 p-4">
        <p className="flex items-center gap-2 font-display text-base"><Footprints size={16} className="text-accent" /> Passo prático</p>
        <p className="text-[14px]">{o.atitude}</p>
      </div>
      {o.notas.length > 0 && (
        <div className="rounded-xl bg-surface-2 px-4 py-3 text-[13px]">
          <p className="flex items-center gap-1.5 font-medium"><Info size={14} /> Nota de interpretação devocional</p>
          <ul className="mt-1 space-y-1 text-muted">{o.notas.map((n) => <li key={n}>{n}</li>)}</ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {acao?.(o.texto)}
        <button type="button" onClick={copiar} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line/30 px-3 text-[13px]">
          {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiada' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
