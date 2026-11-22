'use client';
import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Shield } from 'lucide-react';
import { PageHeader } from '@/components/ui/states';
import { OracaoBatalha } from '@/components/portals/OracaoBatalha';
import { PORTALS, currentPortal, getPortal, nomePortal, type PortalId } from '@/lib/content/portals';
import { useNow } from '@/lib/store/provider';

const LIMITES = [
  'Nossa luta não é contra pessoas (Efésios 6:12): familiares, outras religiões e grupos não são inimigos espirituais.',
  'Doenças, finanças, conflitos, sonhos ou emoções não são, por si, prova de ação demoníaca.',
  'Pedimos a Deus que envie Seus anjos para guardar; não damos ordens a anjos nem atribuímos nomes ou hierarquias a demônios ou anjos.',
  'A oração não é fórmula de garantia: não promete cura, prosperidade nem livramento automático.',
  'Horários, dias, meses e estações são organização devocional, não regências obrigatórias. Não é preciso acordar de madrugada.',
];

export default function Oracao() {
  const now = useNow();
  const [portal, setPortal] = useState<PortalId>(() => currentPortal(now).id);
  const p = getPortal(portal)!;
  return (
    <>
      <PageHeader eyebrow="Batalha espiritual" titulo="Oração de batalha" />
      <p className="-mt-3 mb-5 font-serif text-[16px]">
        Orar com firmeza contra o mal, pedir a proteção de Deus e assumir responsabilidade pelas próprias atitudes — sem medo, apoiada na vitória de Cristo.
      </p>
      <p className="eyebrow">Portal</p>
      <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Portal">
        {PORTALS.map((pt) => (
          <button key={pt.id} type="button" onClick={() => setPortal(pt.id)} aria-pressed={portal === pt.id}
            className={clsx('min-h-10 shrink-0 rounded-full border px-3 text-[13px]', portal === pt.id ? 'border-ouro bg-ouro text-noite' : 'border-line/30 text-muted')}>
            {String(pt.hora).padStart(2, '0')}h · {pt.nome}
          </button>
        ))}
      </div>
      <p className="mb-4 mt-2 text-[12px] text-accent">{nomePortal(p)} — {p.proposito}</p>
      <OracaoBatalha key={portal} portal={portal} acao={() =>
        <Link href={`/vigilias/${portal}/`} className="inline-flex min-h-10 items-center rounded-full bg-ouro px-4 text-[13px] font-medium text-noite">Ir para o portal</Link>} />

      <section className="card mt-6 p-4">
        <h2 className="flex items-center gap-2 font-display text-base"><Shield size={16} className="text-accent" /> Com equilíbrio bíblico</h2>
        <p className="mt-1 text-[13px] text-muted">Base: Efésios 6:10-18 · Tiago 4:7-8 · 1 Pedro 5:8-9 · 2 Coríntios 10:3-5 · Mateus 6:9-13 · Romanos 12:21</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px]">{LIMITES.map((l) => <li key={l}>{l}</li>)}</ul>
      </section>
    </>
  );
}
