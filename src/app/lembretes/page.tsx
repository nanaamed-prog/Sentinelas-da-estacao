'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { CalendarPlus, BellRing } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/states';
import { PORTALS, formatHora, nomePortal } from '@/lib/content/portals';
import { codificar, horarioDe, lembretesDe } from '@/lib/reminders/ics';
import { useDB, useStore } from '@/lib/store/provider';

type Permissao = 'indisponivel' | 'default' | 'granted' | 'denied';

export default function Lembretes() {
  const db = useDB();
  const store = useStore();
  const prefs = db.preferencias;
  const ativos = PORTALS.filter((p) => prefs.portaisAtivos.includes(p.id));
  const [perm, setPerm] = useState<Permissao>('indisponivel');
  useEffect(() => { if ('Notification' in window) setPerm(Notification.permission as Permissao); }, []);

  const mudarHora = (id: (typeof PORTALS)[number]['id'], v: string) => {
    const h = { ...prefs.horariosLembrete };
    if (!v || v === formatHora(PORTALS.find((p) => p.id === id)!.hora)) delete h[id]; else h[id] = v;
    store.setPreferences({ horariosLembrete: h });
  };

  async function avisosNoApp(ligar: boolean) {
    if (ligar && 'Notification' in window && Notification.permission === 'default') {
      try { setPerm((await Notification.requestPermission()) as Permissao); } catch { /* sem suporte */ }
    }
    store.setPreferences({ lembretes: ligar });
  }

  const linkIcs = `/api/lembretes/?p=${codificar(lembretesDe(prefs))}`;

  return (
    <>
      <PageHeader eyebrow="Lembretes" titulo="Lembretes dos portais">Escolha o horário de cada portal. Você pode mudar ou desligar quando quiser.</PageHeader>

      {ativos.length === 0 ? (
        <EmptyState titulo="Nenhum portal escolhido" texto="Escolha seus portais de oração para receber lembretes."
          acao={<Link href="/vigilias/" className="btn-primary">Escolher portais</Link>} />
      ) : (
        <div className="space-y-6">
          <ul className="card divide-y divide-line/15">
            {ativos.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-[16px]">{nomePortal(p)}</span>
                  <span className="block text-[12px] text-accent">{p.proposito} · portal às {formatHora(p.hora)}</span>
                </span>
                <label className="sr-only" htmlFor={`h-${p.id}`}>Horário do lembrete do {nomePortal(p)}</label>
                <input id={`h-${p.id}`} type="time" className="field !w-[8.75rem] shrink-0 !px-3 py-2 text-center" value={horarioDe(prefs, p.id)}
                  onChange={(e) => mudarHora(p.id, e.target.value)} />
              </li>
            ))}
          </ul>
          <p className="-mt-3 text-[12px] text-muted">Para incluir ou tirar um portal, use o botão de rotina na tela de cada vigília.</p>

          <section className="card space-y-3 p-4">
            <div className="flex items-start gap-3">
              <CalendarPlus className="mt-0.5 shrink-0 text-accent" size={22} />
              <div>
                <h2 className="font-display text-lg">No calendário do celular</h2>
                <p className="mt-1 font-serif text-[14px] text-muted">A forma mais confiável: o celular avisa todos os dias nos horários acima, mesmo com o app fechado.</p>
              </div>
            </div>
            <a href={linkIcs} target="_blank" rel="noopener" className="btn-primary w-full">Adicionar ao meu calendário</a>
            <details className="text-[13px] text-muted">
              <summary className="min-h-10 cursor-pointer py-2 text-accent">Como funciona no meu celular?</summary>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong className="text-fg">iPhone:</strong> toque no botão e depois em “Adicionar Todos”.</li>
                <li><strong className="text-fg">Android:</strong> o arquivo será baixado; abra-o e escolha o app Agenda/Google Agenda.</li>
                <li>Mudou os horários? Toque de novo: os eventos são atualizados, sem duplicar.</li>
                <li>Para desligar, apague os eventos “Portal…” no seu calendário.</li>
              </ul>
            </details>
          </section>

          <section className="card space-y-3 p-4">
            <div className="flex items-start gap-3">
              <BellRing className="mt-0.5 shrink-0 text-accent" size={22} />
              <div className="flex-1">
                <h2 className="font-display text-lg">Aviso com o app aberto</h2>
                <p className="mt-1 font-serif text-[14px] text-muted">Se o app estiver aberto na hora do portal, ele avisa você.</p>
              </div>
              <button role="switch" aria-checked={prefs.lembretes} aria-label="Aviso com o app aberto" onClick={() => void avisosNoApp(!prefs.lembretes)}
                className={clsx('relative mt-1 h-7 w-12 shrink-0 rounded-full transition', prefs.lembretes ? 'bg-ouro' : 'bg-line/30')}>
                <span className={clsx('absolute top-1 h-5 w-5 rounded-full bg-marfim transition-all', prefs.lembretes ? 'left-6' : 'left-1')} />
              </button>
            </div>
            {prefs.lembretes && perm === 'denied' && <p className="text-[12px] text-muted">As notificações estão bloqueadas no navegador; o aviso aparecerá dentro do app.</p>}
          </section>
        </div>
      )}
    </>
  );
}
