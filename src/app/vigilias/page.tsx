'use client';
import Link from 'next/link';
import { BellRing } from 'lucide-react';
import { PageHeader } from '@/components/ui/states';
import { PortalCard } from '@/components/portals/PortalCard';
import { PORTALS, currentPortal, nomePortal } from '@/lib/content/portals';
import { useDB, useNow } from '@/lib/store/provider';
import { dataCurta } from '@/lib/utils/format';
import { getPortal } from '@/lib/content/portals';

export default function Vigilias() {
  const db = useDB();
  const now = useNow();
  const atual = currentPortal(now);
  const historico = db.vigilias.filter((v) => v.fim).slice(0, 10);
  return (
    <>
      <PageHeader eyebrow="Os oito portais" titulo="Vigílias">Oito horários. Um propósito.</PageHeader>
      <Link href="/lembretes/" className="-mt-3 mb-4 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line/30 px-4 text-[13px] text-accent"><BellRing size={14} /> Lembretes e horários</Link>
      <ul className="space-y-2.5">
        {PORTALS.map((p) => <li key={p.id}><PortalCard portal={p} atual={p.id === atual.id} ativo={db.preferencias.portaisAtivos.includes(p.id)} /></li>)}
      </ul>
      <section className="mt-8">
        <h2 className="font-display text-lg">Histórico recente</h2>
        {historico.length === 0
          ? <p className="mt-2 font-serif text-[14px] text-muted">Quando você concluir uma vigília, ela aparece aqui.</p>
          : <ul className="mt-3 divide-y divide-line/15">{historico.map((v) => (
              <li key={v.id} className="flex justify-between py-3 text-[14px]">
                <span>{nomePortal(getPortal(v.portal)!)}</span><span className="text-muted">{dataCurta(v.inicio)}</span>
              </li>))}
            </ul>}
      </section>
    </>
  );
}
