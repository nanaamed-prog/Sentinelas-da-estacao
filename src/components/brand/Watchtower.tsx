import type { SeasonId } from '@/lib/content/seasons';

/** Paletas de céu por estação — muda só a atmosfera, nunca "nível" espiritual. */
const CEU: Record<SeasonId | 'padrao', [string, string, string]> = {
  padrao: ['#111C29', '#632B2A', '#E2A55C'],
  primavera: ['#1B2433', '#8A4A5A', '#F2B9A6'],
  verao: ['#14202E', '#7A3F22', '#F4C06A'],
  outono: ['#141B26', '#632B2A', '#D9823F'],
  inverno: ['#0E1824', '#3B4E66', '#B9C8D8'],
};

/** Torre de vigília em pedra com lanterna acesa — símbolo principal do app. */
export function TowerMark({ className = '', glow = true }: { className?: string; glow?: boolean }) {
  return (
    <svg viewBox="0 0 64 96" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="tm-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFE3A8" stopOpacity=".95" />
          <stop offset=".45" stopColor="#C58B42" stopOpacity=".45" />
          <stop offset="1" stopColor="#C58B42" stopOpacity="0" />
        </radialGradient>
      </defs>
      {glow && <circle cx="32" cy="24" r="22" fill="url(#tm-glow)" className="animate-flicker" />}
      <path d="M32 4 L42 16 H22 Z" fill="none" stroke="#C58B42" strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="32" y1="1" x2="32" y2="4" stroke="#C58B42" strokeWidth="1.6" />
      <rect x="24" y="16" width="16" height="14" rx="1" fill="none" stroke="#C58B42" strokeWidth="1.6" />
      <rect x="29" y="19" width="6" height="8" rx="3" fill="#FFD58A" />
      <path d="M20 30 H44 L42 34 H22 Z" fill="none" stroke="#C58B42" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M23 34 L19 92 H45 L41 34" fill="none" stroke="#C58B42" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M22 50 H42 M21 66 H43 M20 80 H44" stroke="#C58B42" strokeWidth="1" opacity=".6" />
      <path d="M28 92 V84 a4 4 0 0 1 8 0 V92" fill="none" stroke="#C58B42" strokeWidth="1.4" />
      <rect x="30" y="56" width="4" height="6" rx="2" fill="none" stroke="#C58B42" strokeWidth="1.1" />
    </svg>
  );
}

/** Cena completa: céu, montanhas, torre e lanterna. Usada no topo de Minha Torre e no onboarding. */
export function WatchtowerHero({ estacao, className = '' }: { estacao?: SeasonId | null; className?: string }) {
  const [c1, c2, c3] = CEU[estacao ?? 'padrao'];
  return (
    <svg viewBox="0 0 390 260" preserveAspectRatio="xMidYMax slice" className={className} role="img" aria-label="Torre de vigília com lanterna acesa diante das montanhas">
      <defs>
        <linearGradient id="wh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset=".62" stopColor={c2} />
          <stop offset="1" stopColor={c3} />
        </linearGradient>
        <radialGradient id="wh-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFE9C2" stopOpacity=".9" />
          <stop offset="1" stopColor="#FFE9C2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wh-lamp" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFD98F" stopOpacity="1" />
          <stop offset=".5" stopColor="#C58B42" stopOpacity=".35" />
          <stop offset="1" stopColor="#C58B42" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wh-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset=".55" stopColor="#0B131D" stopOpacity="0" />
          <stop offset="1" stopColor="#0B131D" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width="390" height="260" fill="url(#wh-sky)" />
      <circle cx="250" cy="200" r="90" fill="url(#wh-sun)" />
      {/* montanhas em camadas */}
      <path d="M0 196 L60 150 L105 178 L170 122 L230 176 L290 140 L350 170 L390 150 V260 H0 Z" fill="#2A2632" opacity=".55" />
      <path d="M0 214 L50 186 L120 210 L190 170 L260 206 L330 182 L390 200 V260 H0 Z" fill="#1A1F2B" opacity=".85" />
      <path d="M0 236 L80 218 L170 232 L260 214 L390 230 V260 H0 Z" fill="#111722" />
      {/* torre */}
      <g transform="translate(64 40)">
        <circle cx="34" cy="36" r="40" fill="url(#wh-lamp)" className="animate-flicker" />
        <path d="M34 8 L48 26 H20 Z" fill="#1A1A22" stroke="#C58B42" strokeWidth="1.4" />
        <rect x="23" y="26" width="22" height="20" fill="#1A1A22" stroke="#C58B42" strokeWidth="1.4" />
        <rect x="29" y="30" width="10" height="13" rx="5" fill="#FFD58A" />
        <path d="M18 46 H50 L47 52 H21 Z" fill="#23232C" stroke="#C58B42" strokeWidth="1.2" />
        <path d="M22 52 L14 220 H54 L46 52 Z" fill="#2B2A31" />
        <path d="M22 52 L14 220 H30 L30 52 Z" fill="#35333B" />
        <path d="M20 90 H48 M18 130 H50 M16 175 H52" stroke="#5A4A3A" strokeWidth="1" opacity=".7" />
        <rect x="31" y="110" width="6" height="10" rx="3" fill="#FFC56B" opacity=".85" />
      </g>
      <rect width="390" height="260" fill="url(#wh-fade)" />
    </svg>
  );
}
