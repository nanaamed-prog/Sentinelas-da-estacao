import { notFound } from 'next/navigation';
import { CAPITULOS, getCapitulo } from '@/lib/content/ebook';
import { DevotionalReader } from '@/components/library/DevotionalReader';

export function generateStaticParams() { return CAPITULOS.map((c) => ({ slug: c.slug })); }

export default async function CapituloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cap = getCapitulo(slug);
  if (!cap) notFound();
  return <DevotionalReader cap={cap} />;
}
