import type { SeasonId } from '@/lib/content/seasons';
import { getSeason } from '@/lib/content/seasons';

/** Ilustração discreta de cada estação (sem fotos repetidas). */
export function SeasonArt({ id, className = '' }: { id: SeasonId; className?: string }) {
  const s = getSeason(id)!;
  const [a, b, c] = s.cores;
  const gid = `sa-${id}`;
  return (
    <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} /><stop offset=".6" stopColor={b} /><stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <rect width="320" height="140" fill={`url(#${gid})`} />
      <path d="M0 110 Q80 85 160 105 T320 98 V140 H0 Z" fill={c} opacity=".55" />
      {/* árvore: muda por estação */}
      <g transform="translate(238 30)" opacity=".9">
        <path d="M22 90 V48 M22 62 L8 46 M22 56 L36 40" stroke="#2E2420" strokeWidth="3" strokeLinecap="round" fill="none" />
        {id === 'primavera' && [[6, 40], [16, 30], [30, 28], [40, 38], [24, 22], [10, 52], [38, 50]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="7" fill="#F9D6DA" opacity=".9" />)}
        {id === 'verao' && <><circle cx="22" cy="34" r="24" fill="#5D7F3E" /><circle cx="12" cy="40" r="3" fill="#E5683A" /><circle cx="30" cy="28" r="3" fill="#E5683A" /><circle cx="26" cy="46" r="3" fill="#E5683A" /></>}
        {id === 'outono' && <><circle cx="22" cy="36" r="20" fill="#C9662F" opacity=".85" /><path d="M-30 80 l6 -4 M-50 70 l5 3 M60 76 l-5 3" stroke="#C9662F" strokeWidth="4" strokeLinecap="round" /></>}
        {id === 'inverno' && <path d="M8 46 l-6 -8 M36 40 l6 -9 M22 48 V30 l-5 -6 M22 30 l6 -6" stroke="#2E2420" strokeWidth="2" strokeLinecap="round" fill="none" />}
      </g>
      {id === 'inverno' && <path d="M0 112 L60 70 L110 100 L170 62 L240 108 L320 80 V140 H0 Z" fill="#E9EFF5" opacity=".6" />}
    </svg>
  );
}
