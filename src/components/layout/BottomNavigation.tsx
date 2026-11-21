'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Castle, Flame, Leaf, HandHeart, NotebookPen } from 'lucide-react';
import clsx from 'clsx';

export const NAV = [
  { href: '/', label: 'Minha Torre', Icon: Castle },
  { href: '/vigilias/', label: 'Vigílias', Icon: Flame },
  { href: '/estacoes/', label: 'Estações', Icon: Leaf },
  { href: '/altar/', label: 'Meu Altar', Icon: HandHeart },
  { href: '/diario/', label: 'Diário', Icon: NotebookPen },
] as const;

export function isActive(pathname: string, href: string) {
  const p = pathname.endsWith('/') ? pathname : pathname + '/';
  return href === '/' ? p === '/' : p.startsWith(href);
}

export function BottomNavigation() {
  const pathname = usePathname() ?? '/';
  return (
    <nav aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/20 bg-noite-900/95 backdrop-blur-md [padding-bottom:env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV.map(({ href, label, Icon }) => {
          const on = isActive(pathname, href);
          return (
            <li key={href}>
              <Link href={href} aria-current={on ? 'page' : undefined}
                className={clsx('flex min-h-[60px] flex-col items-center justify-center gap-1 text-[10.5px] tracking-wide transition',
                  on ? 'text-ouro' : 'text-[#C4B8A6]/75 hover:text-marfim')}>
                <Icon size={21} strokeWidth={on ? 1.9 : 1.4} />
                <span className={clsx(on && 'font-semibold')}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
