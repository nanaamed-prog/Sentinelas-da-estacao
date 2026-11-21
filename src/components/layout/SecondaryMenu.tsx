'use client';
import Link from 'next/link';
import { BellRing, Route, Library, Sparkles, Calendar, Star, Settings, User, ChevronRight } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';

const ITENS = [
  { label: 'Minha Jornada', Icon: Route, href: '/jornada/' },
  { label: 'Biblioteca', Icon: Library, href: '/biblioteca/' },
  { label: 'Assistente de Oração', Icon: Sparkles, fase: 'Fase 5' },
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
        {ITENS.map((it) => {
          const conteudo = (
            <>
              <it.Icon size={20} strokeWidth={1.5} className="text-accent" />
              <span className="flex-1 text-[15px]">{it.label}</span>
              {'fase' in it ? <span className="rounded-full border border-line/30 px-2.5 py-0.5 text-[11px] text-muted">em breve · {it.fase}</span>
                : <ChevronRight size={18} className="text-muted" />}
            </>
          );
          return (
            <li key={it.label}>
              {'href' in it
                ? <Link href={it.href} onClick={onClose} className="flex min-h-14 items-center gap-4">{conteudo}</Link>
                : <div className="flex min-h-14 items-center gap-4 opacity-70" aria-disabled="true">{conteudo}</div>}
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-center font-display text-xs uppercase tracking-[0.2em] text-muted">Desperte. Vigie. Ore. Permaneça.</p>
    </Sheet>
  );
}
