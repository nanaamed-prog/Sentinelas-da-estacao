'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { BottomNavigation } from './BottomNavigation';
import { SecondaryMenu } from './SecondaryMenu';
import { TowerMark } from '@/components/brand/Watchtower';
import { LoadingState } from '@/components/ui/states';
import { useDB, useHydrated } from '@/lib/store/provider';
import { useAuth } from '@/lib/auth/provider';
import { SyncBadge } from './SyncBadge';

const SEM_MOLDURA = ['/entrar', '/nova-senha', '/privacidade'];

export function AppShell({ children }: { children: ReactNode }) {
  const db = useDB();
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const [menu, setMenu] = useState(false);
  const noOnboarding = pathname.startsWith('/boas-vindas');
  const auth = useAuth();
  const semMoldura = SEM_MOLDURA.some((p) => pathname.startsWith(p));
  const precisaEntrar = auth.configurado && auth.pronto && !auth.session && !semMoldura;

  // tema visual
  useEffect(() => { document.documentElement.dataset.theme = db.preferencias.tema; }, [db.preferencias.tema]);

  // sem conta → entrar; link de recuperação → nova senha
  useEffect(() => {
    if (precisaEntrar) router.replace('/entrar/');
    else if (auth.recuperandoSenha && !pathname.startsWith('/nova-senha')) router.replace('/nova-senha/');
  }, [precisaEntrar, auth.recuperandoSenha, pathname, router]);

  const pronto = hydrated && auth.pronto && auth.carregado && !precisaEntrar;

  // primeira utilização → onboarding
  useEffect(() => {
    if (pronto && !semMoldura && !db.preferencias.onboardingConcluido && !noOnboarding) router.replace('/boas-vindas/');
  }, [pronto, semMoldura, db.preferencias.onboardingConcluido, noOnboarding, router]);

  if (semMoldura && hydrated && auth.pronto) return <>{children}</>;
  if (!pronto) return <LoadingState rotulo={auth.session && !auth.carregado ? 'Buscando seus registros…' : undefined} />;
  if (noOnboarding) return <>{children}</>;
  if (!db.preferencias.onboardingConcluido) return <LoadingState />;

  return (
    <div className="min-h-dvh">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ouro focus:px-3 focus:py-2 focus:text-noite">Pular para o conteúdo</a>
      <header className="sticky top-0 z-30 border-b border-line/10 bg-bg/85 backdrop-blur-md [padding-top:env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" aria-label="Sentinelas da Estação — Minha Torre">
            <TowerMark className="h-8 w-6" glow={false} />
            <span className="font-display text-[15px] uppercase tracking-[0.16em] text-accent">Sentinelas</span>
          </Link>
          <div className="flex items-center gap-1">
          <SyncBadge />
          <button onClick={() => setMenu(true)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Abrir menu">
            <Menu size={22} strokeWidth={1.5} />
          </button>
          </div>
        </div>
      </header>
      <main id="conteudo" className="mx-auto max-w-lg px-5 pb-nav pt-4">{children}</main>
      <BottomNavigation />
      <SecondaryMenu open={menu} onClose={() => setMenu(false)} />
    </div>
  );
}
