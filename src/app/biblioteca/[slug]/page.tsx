import { notFound } from 'next/navigation';
import INDICE from '@/lib/content/ebook-indice.json';
import { CapituloCliente } from '@/components/library/CapituloCliente';

const CAPS = (INDICE as { capitulos: { slug: string; titulo: string }[] }).capitulos;

export function generateStaticParams() { return CAPS.map((c) => ({ slug: c.slug })); }

/** A página estática só tem o índice; o texto chega do servidor depois da verificação do acesso. */
export default async function CapituloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = CAPS.findIndex((c) => c.slug === slug);
  if (i < 0) notFound();
  return <CapituloCliente slug={slug} ant={CAPS[i - 1] ?? null} prox={CAPS[i + 1] ?? null} />;
}
