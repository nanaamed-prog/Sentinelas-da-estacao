'use client';
import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, NotebookPen, AArrowDown, AArrowUp } from 'lucide-react';
import type { Capitulo, Secao } from '@/lib/content/ebook';
import { prepararRascunho } from '@/lib/journal/draft';
import type { TipoDiario } from '@/lib/store/schema';

const TAMANHOS = ['text-[16px]', 'text-[17.5px]', 'text-[19px]', 'text-[21px]'];
const K_TAM = 'sentinelas:leitura-tamanho';
import { K_ULTIMA } from './chaves';

/** **negrito** simples vindo do conteúdo estruturado */
function Rico({ t }: { t: string }) {
  return <>{t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => p.startsWith('**') ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>)}</>;
}

function tipoDiario(cap: Capitulo, s: Secao): TipoDiario {
  if (cap.slug === 'diario-da-sentinela') {
    if (s.titulo === 'Palavra') return 'Palavra';
    if (s.titulo === 'Discernimento') return 'Discernimento';
    if (s.titulo === 'Fechamento do dia') return 'Fechamento do dia';
  }
  if (s.titulo === 'Quando a resposta chega') return 'Testemunho';
  if (/discern/i.test(s.titulo)) return 'Discernimento';
  return 'Reflexão livre';
}

type Vizinho = { slug: string; titulo: string } | null;

export function DevotionalReader({ cap, ant, prox }: { cap: Capitulo; ant?: Vizinho; prox?: Vizinho }) {
  const router = useRouter();
  const [tam, setTam] = useState(1);
  useEffect(() => {
    try { const t = Number(localStorage.getItem(K_TAM)); if (t >= 0 && t < TAMANHOS.length) setTam(t); localStorage.setItem(K_ULTIMA, cap.slug); } catch { /* noop */ }
    window.scrollTo(0, 0);
  }, [cap.slug]);
  const mudar = (d: number) => setTam((v) => { const n = Math.max(0, Math.min(TAMANHOS.length - 1, v + d)); try { localStorage.setItem(K_TAM, String(n)); } catch { /* noop */ } return n; });


  function registrar(s: Secao) {
    const perguntas = s.campos ?? (s.reflexao.includes('?') ? s.reflexao.split(/(?<=\?)\s+/) : []);
    prepararRascunho({
      tipo: tipoDiario(cap, s),
      titulo: ((t) => t.charAt(0).toUpperCase() + t.slice(1))(s.titulo.replace(/^Exercício — /, '')),
      texto: perguntas.length ? perguntas.map((q) => `${q.replace(/:$/, '')}${q.endsWith('?') ? '' : ':'}\n\n`).join('') : '',
      referencia: s.leituras[0] ?? '',
      marcadores: cap.estacao ? cap.titulo.split(' — ')[0] : '',
    });
    router.push('/diario/#novo');
  }

  return (
    <article className="-mx-5 -mt-4">
      <div className="sticky top-14 z-20 flex items-center justify-between border-b border-line/10 bg-bg/90 px-3 py-1 backdrop-blur">
        <Link href="/biblioteca/" className="inline-flex min-h-11 items-center gap-1 px-2 text-sm text-muted"><ChevronLeft size={18} /> Biblioteca</Link>
        <div className="flex items-center gap-1" role="group" aria-label="Tamanho do texto">
          <button onClick={() => mudar(-1)} disabled={tam === 0} className="grid h-11 w-11 place-items-center rounded-full disabled:opacity-30" aria-label="Diminuir texto"><AArrowDown size={20} /></button>
          <button onClick={() => mudar(1)} disabled={tam === TAMANHOS.length - 1} className="grid h-11 w-11 place-items-center rounded-full disabled:opacity-30" aria-label="Aumentar texto"><AArrowUp size={20} /></button>
        </div>
      </div>

      <header className="px-6 pb-8 pt-10 text-center">
        {cap.numero && <p className="eyebrow">Capítulo {String(cap.numero).padStart(2, '0')}</p>}
        <h1 className="mt-2 font-display text-[32px] leading-tight">{cap.titulo}</h1>
        <p className="mt-2 font-serif italic text-accent">{cap.epigrafe}</p>
        <div className="mx-auto mt-6 h-px w-16 bg-ouro/60" />
      </header>

      <div className={clsx('leitura space-y-12 px-6 py-10', TAMANHOS[tam])}>
        {cap.secoes.map((s, i) => (
          <section key={i} aria-labelledby={`s-${i}`}>
            <h2 id={`s-${i}`} className="font-display text-[1.45em] leading-snug">{s.titulo}</h2>
            {s.subtitulo && <p className="mt-1 font-sans text-[0.7em] font-semibold uppercase tracking-[0.14em] text-[#8C5C22]">{s.subtitulo}</p>}
            <div className="mt-4 space-y-4">{s.paragrafos.map((p, j) => <p key={j}><Rico t={p} /></p>)}</div>
            {s.destaque && <blockquote className="mt-5 border-l-2 border-[#C58B42] pl-4 font-display text-[1.1em] italic">{s.destaque}</blockquote>}
            {s.leituras.length > 0 && (
              <div className="mt-6">
                <p className="font-sans text-[0.65em] font-semibold uppercase tracking-[0.16em] text-[#8C5C22]">Para ler na Bíblia</p>
                <ul className="mt-2 flex flex-wrap gap-2">{s.leituras.map((r) => <li key={r} className="rounded-full border border-[#C58B42]/50 px-3 py-1 font-sans text-[0.75em]">{r}</li>)}</ul>
              </div>
            )}
            {(s.reflexao || s.campos) && (
              <div className="mt-6 rounded-2xl bg-pergaminho/70 p-5">
                <p className="font-sans text-[0.65em] font-semibold uppercase tracking-[0.16em] text-[#8C5C22]">Reflexão / Oração</p>
                {s.reflexao && <p className="mt-2 italic">{s.reflexao}</p>}
                {s.campos && <ul className="mt-2 list-disc space-y-1 pl-5 italic">{s.campos.map((c) => <li key={c}>{c}</li>)}</ul>}
                {(s.campos || s.reflexao.includes('?')) && (
                  <button onClick={() => registrar(s)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-noite px-4 font-sans text-[14px] text-marfim">
                    <NotebookPen size={16} /> Registrar no meu diário
                  </button>
                )}
              </div>
            )}
          </section>
        ))}
        <p className="text-center font-sans text-[12px] text-[#6E6050]">Sentinelas da Estação · Naiara de Medeiros</p>
      </div>

      <nav className="grid grid-cols-2 gap-3 px-5 py-6" aria-label="Capítulos">
        {ant ? <Link href={`/biblioteca/${ant.slug}/`} className="card flex min-h-16 items-center gap-2 p-3 text-[13px]"><ChevronLeft size={16} className="shrink-0 text-accent" /><span className="line-clamp-2">{ant.titulo}</span></Link> : <span />}
        {prox && <Link href={`/biblioteca/${prox.slug}/`} className="card flex min-h-16 items-center justify-end gap-2 p-3 text-right text-[13px]"><span className="line-clamp-2">{prox.titulo}</span><ChevronRight size={16} className="shrink-0 text-accent" /></Link>}
      </nav>
    </article>
  );
}
