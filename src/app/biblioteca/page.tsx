'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, KeyRound } from 'lucide-react';
import { useAssinatura } from '@/lib/assinatura/cliente';
import { CAPITULOS_GRATUITOS } from '@/lib/assinatura/planos';
import { PageHeader } from '@/components/ui/states';
import { SeasonArt } from '@/components/seasons/SeasonArt';
import INDICE from '@/lib/content/ebook-indice.json';
import { K_ULTIMA } from '@/components/library/chaves';
import type { SeasonId } from '@/lib/content/seasons';

const LIVRO = INDICE as { titulo: string; edicao: string; autora: string; capitulos: { slug: string; numero: number | null; titulo: string; epigrafe: string; estacao?: SeasonId; partes: number }[] };
const CAPITULOS = LIVRO.capitulos;
const getCapitulo = (s: string) => CAPITULOS.find((c) => c.slug === s);

export default function Biblioteca() {
  const [ultima, setUltima] = useState<string | null>(null);
  useEffect(() => { try { setUltima(localStorage.getItem(K_ULTIMA)); } catch { /* noop */ } }, []);
  const cont = ultima ? getCapitulo(ultima) : undefined;
  const { completo } = useAssinatura();

  return (
    <>
      <PageHeader eyebrow="Biblioteca" titulo={LIVRO.titulo}>{LIVRO.edicao} · {LIVRO.autora}</PageHeader>

      {cont && (
        <Link href={`/biblioteca/${cont.slug}/`} className="card mb-5 flex items-center gap-4 p-4 shadow-glow">
          <BookOpen size={22} className="shrink-0 text-accent" />
          <span className="flex-1"><span className="eyebrow block">Continuar lendo</span><span className="block font-serif text-[16px]">{cont.titulo}</span></span>
          <ChevronRight size={18} className="text-muted" />
        </Link>
      )}

      <ol className="space-y-2.5">
        {CAPITULOS.map((c) => (
          <li key={c.slug}>
            <Link href={`/biblioteca/${c.slug}/`} className="card relative flex min-h-[76px] items-center gap-4 overflow-hidden p-4">
              {c.estacao && <><SeasonArt id={c.estacao} className="absolute inset-0 h-full w-full opacity-35" /><span className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-transparent" /></>}
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line/40 font-display text-accent">{c.numero ? String(c.numero).padStart(2, '0') : '·'}</span>
              <span className="relative flex-1">
                <span className="block font-serif text-[16px] leading-snug">{c.titulo}</span>
                <span className="block text-[12px] text-muted">{c.epigrafe} · {c.partes} {c.partes === 1 ? 'parte' : 'partes'}
                  {!completo && !CAPITULOS_GRATUITOS.includes(c.slug) && <span className="ml-1.5 inline-flex items-center gap-1 align-middle"><KeyRound size={11} aria-hidden /> Completo</span>}</span>
              </span>
              <ChevronRight size={18} className="relative text-muted" />
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
