'use client';
import Link from 'next/link';
import { Shield, BellRing, Route, Library, Sparkles, Calendar, Star, Settings, User, ChevronRight } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';

const ITENS = [
  { label: 'Minha Jornada', Icon: Route, href: '/jornada/' },
  { label: 'Oração de batalha', Icon: Shield, href: '/oracao/' },
  { label: 'Biblioteca', Icon: Library, href: '/biblioteca/' },
  { label: 'Assistente de Oração', Icon: Sparkles, href: '/assistente/' },
  { label: 'Calendário', Icon: Calendar, href: '/calendario/' },
  { label: 'Testemunhos', Icon: Star, href: '/testemunhos/' },
  { label: 'Lembretes', Icon: BellRing, href: '/lembretes/' },
  { label: 'Configurações', Icon: Settings, href: '/configuracoes/' },
  { label: 'Minha Conta', Icon: User, href: '/configuracoes/#conta' },
] as const;

export function SecondaryMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} titulo="Mais">
      <ul className="divide-y divide-line/15">
        {ITENS.map((it) => (
          <li key={it.label}>
            <Link href={it.href} onClick={onClose} className="flex min-h-14 items-center gap-4">
              <it.Icon size={20} strokeWidth={1.5} className="text-accent" />
              <span className="flex-1 text-[15px]">{it.label}</span>
              <ChevronRight size={18} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center font-display text-xs uppercase tracking-[0.2em] text-muted">Desperte. Vigie. Ore. Permaneça.</p>
    </Sheet>
  );
}
