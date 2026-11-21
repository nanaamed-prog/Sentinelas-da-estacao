import type React from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from '@/lib/store/provider';
import { AuthProvider } from '@/lib/auth/provider';
import Privacidade from '@/app/privacidade/page';
import { AppShell } from '@/components/layout/AppShell';
import { useHashPath } from './shims/router';
import Torre from '@/app/page';
import Onboarding from '@/app/boas-vindas/page';
import Vigilias from '@/app/vigilias/page';
import Estacoes from '@/app/estacoes/page';
import Altar from '@/app/altar/page';
import Diario from '@/app/diario/page';
import Config from '@/app/configuracoes/page';
import NotFound from '@/app/not-found';
import { PrayerSession } from '@/components/portals/PrayerSession';
import { getPortal } from '@/lib/content/portals';

function Rotas() {
  const p = useHashPath();
  const seg = p.split('/').filter(Boolean);
  let page;
  if (!seg.length) page = <Torre />;
  else if (seg[0] === 'boas-vindas') page = <Onboarding />;
  else if (seg[0] === 'privacidade') page = <Privacidade />;
  else if (seg[0] === 'vigilias' && seg[1]) { const pt = getPortal(seg[1]); page = pt ? <PrayerSession key={pt.id} portalId={pt.id} /> : <NotFound />; }
  else page = ({ vigilias: <Vigilias />, estacoes: <Estacoes />, altar: <Altar />, diario: <Diario />, configuracoes: <Config /> } as Record<string, React.ReactElement>)[seg[0]] ?? <NotFound />;
  return <AppShell>{page}</AppShell>;
}

document.documentElement.lang = 'pt-BR';
document.documentElement.dataset.theme = 'noite';
createRoot(document.getElementById('app')!).render(<StoreProvider><AuthProvider><Rotas /></AuthProvider></StoreProvider>);
