'use client';
import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const K = 'sentinelas:instalar-dispensado';

/** Convite para instalar o app (Android: botão nativo; iPhone: instruções do Safari). Some quando já instalado. */
export function InstallPrompt({ compacto }: { compacto?: boolean }) {
  const [evento, setEvento] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [instalado, setInstalado] = useState(true);
  const [dispensado, setDispensado] = useState(true);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalado(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    try { setDispensado(compacto ? localStorage.getItem(K) === '1' : false); } catch { setDispensado(false); }
    const h = (e: Event) => { e.preventDefault(); setEvento(e as BIPEvent); };
    window.addEventListener('beforeinstallprompt', h);
    const ok = () => setInstalado(true);
    window.addEventListener('appinstalled', ok);
    return () => { window.removeEventListener('beforeinstallprompt', h); window.removeEventListener('appinstalled', ok); };
  }, [compacto]);

  if (instalado || dispensado || (!evento && !ios)) return null;
  const dispensar = () => { setDispensado(true); try { localStorage.setItem(K, '1'); } catch { /* noop */ } };

  return (
    <div className="card relative flex items-start gap-3 p-4">
      <Download size={20} className="mt-0.5 shrink-0 text-accent" />
      <div className="flex-1">
        <p className="text-[15px] font-medium">Instalar o Sentinelas no celular</p>
        {evento ? (
          <>
            <p className="mt-0.5 text-[13px] text-muted">Abra direto da tela inicial, como um aplicativo, inclusive sem internet.</p>
            <button className="btn-primary mt-3 !min-h-10 !px-4 text-[13px]" onClick={async () => { await evento.prompt(); await evento.userChoice; setEvento(null); }}>Instalar</button>
          </>
        ) : (
          <p className="mt-0.5 text-[13px] text-muted">No Safari, toque em <Share size={13} className="inline -mt-0.5" aria-label="Compartilhar" /> <strong className="text-fg">Compartilhar</strong> e depois em <strong className="text-fg">Adicionar à Tela de Início</strong>.</p>
        )}
      </div>
      {compacto && <button onClick={dispensar} className="grid h-9 w-9 place-items-center rounded-full text-muted" aria-label="Dispensar"><X size={16} /></button>}
    </div>
  );
}
