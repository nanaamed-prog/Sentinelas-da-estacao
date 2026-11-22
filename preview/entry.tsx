import type React from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from '@/lib/store/provider';
import { AuthProvider } from '@/lib/auth/provider';
import { AssinaturaProvider } from '@/lib/assinatura/cliente';
import Privacidade from '@/app/privacidade/page';
import Jornada from '@/app/jornada/page';
import Calendario from '@/app/calendario/page';
import Lembretes from '@/app/lembretes/page';
import Testemunhos from '@/app/testemunhos/page';
import Biblioteca from '@/app/biblioteca/page';
import Assistente from '@/app/assistente/page';
import Oracao from '@/app/oracao/page';
import { CapituloCliente } from '@/components/library/CapituloCliente';
import INDICE from '@/lib/content/ebook-indice.json';
import Planos from '@/app/planos/page';
import MinhaAssinatura from '@/app/assinatura/page';
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
  else if (seg[0] === 'biblioteca' && seg[1]) { const cs = INDICE.capitulos; const i = cs.findIndex((c) => c.slug === seg[1]); page = i >= 0 ? <CapituloCliente key={seg[1]} slug={seg[1]} ant={cs[i - 1] ?? null} prox={cs[i + 1] ?? null} /> : <NotFound />; }
  else if (seg[0] === 'vigilias' && seg[1]) { const pt = getPortal(seg[1]); page = pt ? <PrayerSession key={pt.id} portalId={pt.id} /> : <NotFound />; }
  else page = ({ vigilias: <Vigilias />, estacoes: <Estacoes />, altar: <Altar />, diario: <Diario />, configuracoes: <Config />, jornada: <Jornada />, calendario: <Calendario />, lembretes: <Lembretes />, testemunhos: <Testemunhos />, biblioteca: <Biblioteca />, assistente: <Assistente />, oracao: <Oracao />, planos: <Planos />, assinatura: <MinhaAssinatura /> } as Record<string, React.ReactElement>)[seg[0]] ?? <NotFound />;
  return <AppShell>{page}</AppShell>;
}

document.documentElement.lang = 'pt-BR';
document.documentElement.dataset.theme = 'noite';
createRoot(document.getElementById('app')!).render(<StoreProvider><AuthProvider><AssinaturaProvider><Rotas /></AssinaturaProvider></AuthProvider></StoreProvider>);
