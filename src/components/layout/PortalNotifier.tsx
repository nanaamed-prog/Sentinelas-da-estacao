'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Flame } from 'lucide-react';
import { getPortal, nomePortal, type PortalId } from '@/lib/content/portals';
import { lembretesDe } from '@/lib/reminders/ics';
import { useDB } from '@/lib/store/provider';

const chave = (d: Date, id: string) => `sentinelas:avisado:${d.toDateString()}:${id}`;

/** Aviso na hora do portal enquanto o app está aberto (notificação do sistema, se permitida, e faixa no app). */
export function PortalNotifier() {
  const db = useDB();
  const [aviso, setAviso] = useState<PortalId | null>(null);
  const { lembretes } = db.preferencias;

  useEffect(() => {
    if (!lembretes) return;
    const lista = lembretesDe(db.preferencias);
    const verificar = () => {
      const agora = new Date();
      const hm = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
      const l = lista.find((x) => x.hora === hm);
      if (!l) return;
      try { if (localStorage.getItem(chave(agora, l.portal))) return; localStorage.setItem(chave(agora, l.portal), '1'); } catch { /* sem armazenamento */ }
      setAviso(l.portal);
      const p = getPortal(l.portal)!;
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          const corpo = { body: `${p.proposito} — hora da vigília.`, icon: '/icons/icon-192.png', tag: `portal-${p.id}`, data: { url: `/vigilias/${p.id}/` } };
          navigator.serviceWorker?.ready.then((r) => r.showNotification(nomePortal(p), corpo)).catch(() => new Notification(nomePortal(p), corpo));
        }
      } catch { /* notificação indisponível */ }
    };
    verificar();
    const t = setInterval(verificar, 20_000);
    return () => clearInterval(t);
  }, [lembretes, db.preferencias]);

  if (!aviso) return null;
  const p = getPortal(aviso)!;
  return (
    <div role="alert" className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4rem)] z-50 mx-auto flex max-w-lg items-center gap-3 rounded-card border border-ouro/60 bg-noite-700 p-3 text-marfim shadow-glow animate-fade-up">
      <Flame className="shrink-0 text-ouro" size={22} />
      <Link href={`/vigilias/${p.id}/`} onClick={() => setAviso(null)} className="flex-1">
        <span className="block font-display">{nomePortal(p)}</span>
        <span className="block text-[13px] text-marfim/80">{p.proposito} — toque para iniciar a vigília</span>
      </Link>
      <button onClick={() => setAviso(null)} className="grid h-10 w-10 place-items-center" aria-label="Dispensar"><X size={18} /></button>
    </div>
  );
}
