import clsx from 'clsx';
import { Check } from 'lucide-react';
import { getSeason, periodoTexto, type SeasonId } from '@/lib/content/seasons';
import { SeasonArt } from './SeasonArt';

export function SeasonCard({ id, selecionada, onClick, compacto }: { id: SeasonId; selecionada?: boolean; onClick?: () => void; compacto?: boolean }) {
  const s = getSeason(id)!;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} aria-pressed={onClick ? !!selecionada : undefined}
      className={clsx('relative block w-full overflow-hidden rounded-card text-left shadow-card transition',
        selecionada ? 'ring-2 ring-ouro' : 'ring-1 ring-line/20', onClick && 'active:scale-[.99]')}>
      <SeasonArt id={id} className={clsx('absolute inset-0 h-full w-full')} />
      <div className="absolute inset-0 bg-gradient-to-r from-noite-900/85 via-noite-900/45 to-transparent" />
      <div className={clsx('relative px-5 text-marfim', compacto ? 'py-4' : 'py-6')}>
        <p className="font-display text-[22px] uppercase tracking-wide">{s.nome}</p>
        <p className="font-display text-[15px] uppercase tracking-[0.12em] text-ouro-300">{s.chamado}</p>
        <p className="mt-1 font-sans text-[12px] tracking-wide text-marfim/80">{periodoTexto(s)}</p>
        {!compacto && <p className="mt-2 max-w-[70%] font-serif text-[13.5px] text-marfim/85">{s.temas.slice(0, 3).join(' · ')}</p>}
      </div>
      {selecionada && <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-ouro text-noite"><Check size={16} /></span>}
    </Tag>
  );
}

export function SeasonSelector({ valor, onChange }: { valor?: SeasonId; onChange: (id: SeasonId) => void }) {
  return (
    <div className="grid gap-3" role="group" aria-label="Escolha sua estação">
      {(['primavera', 'verao', 'outono', 'inverno'] as SeasonId[]).map((id) => (
        <SeasonCard key={id} id={id} selecionada={valor === id} onClick={() => onChange(id)} />
      ))}
    </div>
  );
}
