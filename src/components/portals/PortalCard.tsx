import Link from 'next/link';
import clsx from 'clsx';
import { ChevronRight, Bell, BellOff } from 'lucide-react';
import { formatHora, type Portal, nomePortal } from '@/lib/content/portals';

/** Cor do céu de cada portal ao longo do dia. */
export const CEU_PORTAL: Record<number, string> = {
  0: 'from-[#0B1426] to-[#24384F]', 3: 'from-[#0E1A2E] to-[#3B4E66]', 6: 'from-[#F2B07A] to-[#8A4A5A]', 9: 'from-[#F4C06A] to-[#C58B42]',
  12: 'from-[#F6E2B5] to-[#D8A85C]', 15: 'from-[#E8B66A] to-[#7A6A3A]', 18: 'from-[#E0874A] to-[#632B2A]', 21: 'from-[#2A3550] to-[#111C29]',
};

export function PortalCard({ portal, atual, ativo }: { portal: Portal; atual?: boolean; ativo?: boolean }) {
  return (
    <Link href={`/vigilias/${portal.id}/`}
      className={clsx('flex min-h-[68px] items-center gap-4 rounded-card border p-2 pr-4 transition',
        atual ? 'border-ouro bg-ouro/15 shadow-glow' : 'border-line/20 bg-surface hover:bg-surface-2')}>
      <span className={clsx('grid h-[52px] w-[52px] shrink-0 place-items-center rounded-xl bg-gradient-to-b', CEU_PORTAL[portal.hora])}>
        <span className="font-display text-[15px] text-marfim drop-shadow">{String(portal.hora).padStart(2, '0')}h</span>
      </span>
      <span className="flex-1">
        <span className="block font-serif text-[15px]">{nomePortal(portal)}</span>
        <span className="block text-[13px] text-accent">{portal.proposito}{atual && ' · agora'}</span>
      </span>
      <span className="text-muted" title={ativo ? 'Portal escolhido' : 'Portal não escolhido'}>
        {ativo ? <Bell size={16} className="text-accent" aria-label="Escolhido" /> : <BellOff size={16} aria-label="Não escolhido" />}
      </span>
      <ChevronRight size={18} className="text-muted" />
      <span className="sr-only">{formatHora(portal.hora)}</span>
    </Link>
  );
}
