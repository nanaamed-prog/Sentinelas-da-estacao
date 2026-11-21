/** Capa do e-book — mesma linguagem visual do app: céu ao entardecer, montanhas, torre de pedra e lanterna acesa. */
export function CapaArte() {
  const estrelas = Array.from({ length: 70 }, (_, i) => {
    const x = (i * 137.5) % 1480;
    const y = ((i * 89.3) % 820) + 20;
    const r = (i % 5 === 0 ? 2.4 : 1.2) + ((i * 7) % 3) * 0.3;
    return <circle key={i} cx={x} cy={y} r={r} fill="#FFF9EF" opacity={0.15 + ((i * 13) % 10) / 22} />;
  });
  return (
    <svg viewBox="0 0 1480 2100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B131D" />
          <stop offset=".38" stopColor="#111C29" />
          <stop offset=".5" stopColor="#2A2132" />
          <stop offset=".62" stopColor="#632B2A" />
          <stop offset=".7" stopColor="#B8683A" />
          <stop offset=".76" stopColor="#E2A55C" />
          <stop offset="1" stopColor="#3A2230" />
        </linearGradient>
        <radialGradient id="sol" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFE9C2" stopOpacity=".95" />
          <stop offset=".35" stopColor="#F2B06A" stopOpacity=".55" />
          <stop offset="1" stopColor="#E2A55C" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lampada" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFE3A8" stopOpacity="1" />
          <stop offset=".25" stopColor="#F5C27A" stopOpacity=".7" />
          <stop offset=".6" stopColor="#C58B42" stopOpacity=".22" />
          <stop offset="1" stopColor="#C58B42" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pedra" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4A4247" />
          <stop offset=".45" stopColor="#2E2A31" />
          <stop offset="1" stopColor="#17161C" />
        </linearGradient>
        <linearGradient id="nevoa" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B131D" stopOpacity="0" />
          <stop offset="1" stopColor="#0B131D" stopOpacity=".95" />
        </linearGradient>
      </defs>

      <rect width="1480" height="2100" fill="url(#ceu)" />
      {estrelas}
      {/* sol se pondo atrás das montanhas */}
      <circle cx="1030" cy="1430" r="520" fill="url(#sol)" />
      <circle cx="1030" cy="1440" r="105" fill="#FFE3B0" opacity=".95" />

      {/* montanhas em camadas */}
      <path d="M0 1560 L170 1420 L300 1500 L470 1330 L640 1470 L820 1360 L980 1480 L1160 1380 L1320 1460 L1480 1400 V2100 H0 Z" fill="#3B2A36" />
      <path d="M0 1660 L140 1580 L330 1650 L520 1540 L720 1640 L900 1570 L1090 1650 L1290 1590 L1480 1640 V2100 H0 Z" fill="#241E2A" opacity=".92" />
      <path d="M0 1780 L220 1720 L460 1770 L700 1700 L960 1760 L1220 1710 L1480 1750 V2100 H0 Z" fill="#141720" />

      {/* folhas e flores discretas no primeiro plano */}
      <g fill="#C58B42" opacity=".55">
        <path d="M1240 1990 q40 -90 120 -110 q-30 80 -120 110 z" />
        <path d="M1300 2010 q60 -60 140 -50 q-50 60 -140 50 z" />
        <path d="M120 2000 q-20 -90 -100 -120 q10 90 100 120 z" />
      </g>

      {/* luz da lanterna */}
      <circle cx="430" cy="1130" r="420" fill="url(#lampada)" />

      {/* torre de vigília em pedra */}
      <g transform="translate(-90 360)">
        <path d="M520 470 L640 640 H400 Z" fill="#1A1A22" stroke="#C58B42" strokeWidth="5" strokeLinejoin="round" />
        <line x1="520" y1="420" x2="520" y2="470" stroke="#C58B42" strokeWidth="5" />
        <circle cx="520" cy="412" r="9" fill="#C58B42" />
        <rect x="418" y="640" width="204" height="190" fill="#1A1A22" stroke="#C58B42" strokeWidth="5" />
        <rect x="470" y="675" width="100" height="125" rx="50" fill="#FFD58A" />
        <rect x="490" y="700" width="60" height="80" rx="30" fill="#FFF1C9" />
        <line x1="520" y1="675" x2="520" y2="800" stroke="#C58B42" strokeWidth="3" opacity=".6" />
        <path d="M372 830 H668 L640 885 H400 Z" fill="#23232C" stroke="#C58B42" strokeWidth="4" />
        <path d="M402 885 L330 1760 H710 L638 885 Z" fill="url(#pedra)" />
        {/* fiadas de pedra */}
        <g stroke="#6B5A4A" strokeWidth="3" opacity=".5">
          <path d="M396 1010 H644 M388 1150 H652 M378 1300 H662 M368 1460 H672 M358 1620 H682 M348 1790 H692 " />
          <path d="M470 885 V1010 M560 1010 V1150 M450 1150 V1300 M590 1300 V1460 M480 1460 V1620 M570 1620 V1790 " />
        </g>
        <rect x="498" y="1180" width="44" height="80" rx="22" fill="#FFC56B" opacity=".85" />
        <path d="M470 1760 V1660 a50 50 0 0 1 100 0 V1760" fill="#0F0F14" stroke="#C58B42" strokeWidth="4" />
      </g>

      <rect y="1500" width="1480" height="600" fill="url(#nevoa)" />
    </svg>
  );
}
