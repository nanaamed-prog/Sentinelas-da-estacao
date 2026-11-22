'use client';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useConteudo } from '@/lib/assinatura/cliente';
import type { Biblioteca } from '@/lib/content/ebook';
import { DevotionalReader } from './DevotionalReader';
import { AvisoCompleto } from '@/components/assinatura/RecursoCompleto';

type Viz = { slug: string; titulo: string } | null;

export function CapituloCliente({ slug, ant, prox }: { slug: string; ant: Viz; prox: Viz }) {
  const { dados, estado } = useConteudo<Biblioteca>('biblioteca');
  const cap = dados?.capitulos.find((c) => c.slug === slug);
  if (cap) return <DevotionalReader key={cap.slug} cap={cap} ant={ant} prox={prox} />;
  return (
    <div className="space-y-4">
      <Link href="/biblioteca/" className="-ml-2 inline-flex min-h-11 items-center gap-1 text-sm text-muted"><ChevronLeft size={18} /> Biblioteca</Link>
      {dados && !dados.completo ? <AvisoCompleto recurso="biblioteca" />
        : <p className="rounded-xl bg-surface-2 px-4 py-3 text-[14px] text-muted" aria-live="polite">
            {estado === 'indisponivel' ? 'Conecte-se à internet para abrir este capítulo. Depois da primeira leitura, ele fica disponível offline.' : 'Abrindo o capítulo…'}
          </p>}
    </div>
  );
}
