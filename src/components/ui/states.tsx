import type { ReactNode } from 'react';
import { TowerMark } from '@/components/brand/Watchtower';

export function EmptyState({ titulo, texto, acao, icone }: { titulo: string; texto?: string; acao?: ReactNode; icone?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center animate-fade-up">
      <div className="mb-4 text-accent">{icone ?? <TowerMark className="h-14 w-10" glow={false} />}</div>
      <h3 className="font-display text-xl">{titulo}</h3>
      {texto && <p className="mt-2 max-w-xs font-serif text-[15px] leading-relaxed text-muted">{texto}</p>}
      {acao && <div className="mt-6">{acao}</div>}
    </div>
  );
}

export function LoadingState({ rotulo = 'Acendendo a lanterna…' }: { rotulo?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 text-muted">
      <TowerMark className="h-16 w-11" />
      <span className="text-sm">{rotulo}</span>
    </div>
  );
}

export function ErrorState({ titulo = 'Algo não saiu como esperado', texto, onRetry }: { titulo?: string; texto?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card border-vinho/60 px-6 py-8 text-center">
      <h3 className="font-display text-lg">{titulo}</h3>
      {texto && <p className="mt-2 text-sm text-muted">{texto}</p>}
      {onRetry && <button className="btn-ghost mt-5" onClick={onRetry}>Tentar novamente</button>}
    </div>
  );
}

export function PageHeader({ eyebrow, titulo, children }: { eyebrow?: string; titulo: string; children?: ReactNode }) {
  return (
    <header className="mb-6 pt-2 animate-fade-up">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-1 font-display text-[28px] leading-tight tracking-wide">{titulo}</h1>
      {children && <div className="mt-2 font-serif text-[15px] text-muted">{children}</div>}
    </header>
  );
}

export function Pendente({ children }: { children?: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-line/40 px-4 py-3 text-[13px] text-muted">
      {children ?? 'Conteúdo da autora a ser inserido a partir do e-book.'}
    </p>
  );
}
