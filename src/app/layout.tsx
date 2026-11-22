import type { Metadata, Viewport } from 'next';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/lora/400.css';
import '@fontsource/lora/400-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@/styles/globals.css';
import { StoreProvider } from '@/lib/store/provider';
import { AuthProvider } from '@/lib/auth/provider';
import { AssinaturaProvider } from '@/lib/assinatura/cliente';
import { AppShell } from '@/components/layout/AppShell';
import { ServiceWorker } from '@/components/layout/ServiceWorker';

export const metadata: Metadata = {
  title: 'Sentinelas da Estação',
  description: 'Desperte. Vigie. Ore. Permaneça. — Método devocional de Naiara de Medeiros.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Sentinelas da Estação',
  authors: [{ name: 'Naiara de Medeiros' }],
  appleWebApp: { capable: true, title: 'Sentinelas', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#111C29',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="noite">
      <body>
        <StoreProvider>
          <AuthProvider>
            <AssinaturaProvider>
              <AppShell>{children}</AppShell>
            </AssinaturaProvider>
          </AuthProvider>
        </StoreProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
