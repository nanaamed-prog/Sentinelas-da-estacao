'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, Bell, BellOff, Check, Flame } from 'lucide-react';
import clsx from 'clsx';
import { formatHora, getPortal, type PortalId, nomePortal } from '@/lib/content/portals';
import { useDB, useStore } from '@/lib/store/provider';
import { CEU_PORTAL } from './PortalCard';
import { Pendente } from '@/components/ui/states';
import { ConfirmationDialog } from '@/components/ui/Sheet';
import { dataCurta } from '@/lib/utils/format';
import { PortalPrayer } from './PortalPrayer';
import { OracaoBatalha } from './OracaoBatalha';
import { AvisoCompleto, useCompleto } from '@/components/assinatura/RecursoCompleto';

export function PrayerSession({ portalId }: { portalId: PortalId }) {
  const portal = getPortal(portalId)!;
  const db = useDB();
  const store = useStore();
  const completo = useCompleto();
  const sessao = db.vigilias.find((v) => !v.fim);
  const nesta = sessao?.portal === portalId ? sessao : undefined;
  const outra = sessao && !nesta ? getPortal(sessao.portal) : undefined;
  const ativo = db.preferencias.portaisAtivos.includes(portalId);
  const abertos = db.pedidos.filter((p) => p.status === 'Em oração' || p.status === 'Em acompanhamento');
  const [texto, setTexto] = useState(nesta?.oracaoPessoal ?? '');
  const [cancelar, setCancelar] = useState(false);
  const historico = db.vigilias.filter((v) => v.portal === portalId && v.fim).slice(0, 5);

  // salvamento automático do rascunho da oração
  useEffect(() => {
    if (!nesta) return;
    const t = setTimeout(() => { if (texto !== nesta.oracaoPessoal) store.atualizarVigilia(nesta.id, { oracaoPessoal: texto }); }, 600);
    return () => clearTimeout(t);
  }, [texto, nesta, store]);

  function usarOracao(id: string, t: string) {
    const p = abertos.find((x) => x.id === id);
    if (!p) return;
    const s = nesta ?? store.iniciarVigilia(portalId);
    const novo = (s.oracaoPessoal || texto) ? `${texto.trim()}\n\n${t}` : t;
    setTexto(novo);
    store.atualizarVigilia(s.id, { oracaoPessoal: novo, pedidos: [...new Set([...s.pedidos, id])] });
  }

  function usarTexto(t: string) {
    const s = nesta ?? store.iniciarVigilia(portalId);
    const novo = (s.oracaoPessoal || texto) ? `${texto.trim()}\n\n${t}` : t;
    setTexto(novo);
    store.atualizarVigilia(s.id, { oracaoPessoal: novo });
  }

  const togglePedido = (id: string) => {
    if (!nesta) return;
    const s = new Set(nesta.pedidos);
    s.has(id) ? s.delete(id) : s.add(id);
    store.atualizarVigilia(nesta.id, { pedidos: [...s] });
  };

  return (
    <div className="space-y-5">
      <Link href="/vigilias/" className="-ml-2 inline-flex min-h-11 items-center gap-1 text-sm text-muted"><ChevronLeft size={18} /> Todos os portais</Link>

      <section className={clsx('-mx-5 bg-gradient-to-b px-5 pb-6 pt-8 text-marfim', CEU_PORTAL[portal.hora])}>
        <p className="font-sans text-[13px] tracking-[0.18em]">{formatHora(portal.hora)} — {formatHora((portal.hora + 3) % 24)}</p>
        <h1 className="mt-2 font-display text-[36px] uppercase leading-none tracking-wide drop-shadow">{portal.nome}</h1>
        <p className="mt-2 font-serif text-lg italic drop-shadow">{portal.proposito}</p>
        {nesta && <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-noite-900/50 px-3 py-1 text-[12px]"><Flame size={14} className="text-ouro" /> Vigília ativa</p>}
      </section>

      <section className="leitura rounded-card px-5 py-5">
        <h2 className="font-display text-lg">Explicação devocional</h2>
        <div className="mt-2">{portal.explicacao ? <p>{portal.explicacao}</p> : <Pendente />}</div>
        <h3 className="mt-5 font-display text-base">Referências bíblicas</h3>
        <div className="mt-2">{portal.referencias?.length ? <p>{portal.referencias.join(' · ')}</p> : <Pendente>Referências do e-book a serem inseridas.</Pendente>}</div>
        {portal.perguntas?.length ? (<>
          <h3 className="mt-5 font-display text-base">Para orar e registrar</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 italic">{portal.perguntas.map((q) => <li key={q}>{q}</li>)}</ul>
        </>) : null}
        <Link href="/biblioteca/as-oito-vigilias/" className="mt-4 inline-block font-sans text-[13px] text-[#8C5C22] underline underline-offset-4">Ler “Os Oito Portais” na Biblioteca</Link>
      </section>

      <section>
        <h2 className="font-display text-lg">Oração de batalha espiritual</h2>
        <p className="mt-1 text-[13px] text-muted">
          Firmeza contra o mal, confiança em Deus e responsabilidade pelas próprias atitudes. O horário é uma oportunidade de oração — não tem poder próprio.
          {portal.hora < 6 && ' Não é preciso acordar de madrugada: você pode orar este portal em qualquer momento do dia.'}
        </p>
        <div className="mt-3">
          <OracaoBatalha portal={portalId} acao={(t) =>
            <button type="button" disabled={!!outra} onClick={() => usarTexto(t)}
              className="min-h-10 rounded-full bg-ouro px-4 text-[13px] font-medium text-noite disabled:opacity-50">
              {nesta ? 'Usar na minha oração' : 'Orar agora'}
            </button>} />
        </div>
      </section>

      {abertos.length > 0 && completo && (
        <section>
          <h2 className="font-display text-lg">Orações deste portal pelos seus pedidos</h2>
          <p className="mt-1 text-[13px] text-muted">Cada oração segue a intenção do portal ({portal.proposito.toLowerCase()}) com foco em batalha espiritual: resistir ao mal, pedir a proteção de Deus e assumir as próprias atitudes. Escolha o tema, por quem interceder e o formato.</p>
          <ul className="mt-3 space-y-2">
            {abertos.map((p, i) => (
              <li key={p.id}>
                <details className="card group p-4" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="font-serif text-[16px]">{p.titulo}</span>
                    <span className="text-[12px] text-accent group-open:hidden">Ver oração</span>
                  </summary>
                  <div className="mt-3">
                    <PortalPrayer portal={portalId} pedido={p} acao={(t) =>
                      <button type="button" disabled={!!outra} onClick={() => usarOracao(p.id, t)}
                        className="min-h-10 rounded-full bg-ouro px-4 text-[13px] font-medium text-noite disabled:opacity-50">
                        {nesta ? 'Usar na minha oração' : 'Orar agora'}
                      </button>} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      {nesta ? (
        <section className="space-y-4">
          <div>
            <label htmlFor="oracao" className="font-display text-lg">Minha oração</label>
            <textarea id="oracao" rows={6} className="field mt-2 font-serif" placeholder="Escreva com liberdade. O rascunho é salvo automaticamente."
              value={texto} onChange={(e) => setTexto(e.target.value)} />
          </div>
          {abertos.length > 0 && (
            <div>
              <p className="font-display text-lg">Pedidos nesta vigília</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {abertos.map((p) => {
                  const on = nesta.pedidos.includes(p.id);
                  return <li key={p.id}><button onClick={() => togglePedido(p.id)} aria-pressed={on}
                    className={clsx('min-h-10 rounded-full border px-3 text-[13px]', on ? 'border-ouro bg-ouro/20' : 'border-line/30')}>{p.titulo}</button></li>;
                })}
              </ul>
            </div>
          )}
          <button className="btn-primary w-full" onClick={() => { store.atualizarVigilia(nesta.id, { oracaoPessoal: texto }); store.concluirVigilia(nesta.id); }}>
            <Check size={18} /> Concluir vigília
          </button>
          <button className="min-h-11 w-full text-sm text-muted" onClick={() => setCancelar(true)}>Descartar esta vigília</button>
        </section>
      ) : (
        <section className="space-y-3">
          {outra && <p className="rounded-xl bg-surface-2 px-4 py-3 text-[13px]">Você tem uma vigília em andamento no <Link className="underline" href={`/vigilias/${sessao!.portal}/`}>{nomePortal(outra)}</Link>. Conclua-a antes de iniciar outra.</p>}
          {completo ? (
            <button className="btn-primary w-full" disabled={!!outra} onClick={() => { store.iniciarVigilia(portalId); setTexto(''); }}>
              <Flame size={18} /> Iniciar vigília
            </button>
          ) : <AvisoCompleto recurso="vigilias" compacto />}
        </section>
      )}

      <section className="card flex items-center gap-4 p-4">
        {ativo ? <Bell className="text-accent" size={20} /> : <BellOff className="text-muted" size={20} />}
        <div className="flex-1">
          <p className="text-[15px]">{ativo ? 'Este portal faz parte da sua rotina' : 'Incluir este portal na minha rotina'}</p>
          <Link href="/lembretes/" className="text-[12px] text-accent underline-offset-4 hover:underline">Configurar lembretes e horários</Link>
        </div>
        <button role="switch" aria-checked={ativo} aria-label="Incluir na rotina" onClick={() => store.togglePortal(portalId)}
          className={clsx('relative h-7 w-12 rounded-full transition', ativo ? 'bg-ouro' : 'bg-line/30')}>
          <span className={clsx('absolute top-1 h-5 w-5 rounded-full bg-marfim transition-all', ativo ? 'left-6' : 'left-1')} />
        </button>
      </section>

      <section>
        <h2 className="font-display text-lg">Histórico deste portal</h2>
        {historico.length === 0 ? <p className="mt-2 font-serif text-[14px] text-muted">Nenhuma vigília concluída aqui ainda.</p> : (
          <ul className="mt-2 space-y-2">{historico.map((v) => (
            <li key={v.id} className="card p-3">
              <p className="text-[12px] text-muted">{dataCurta(v.inicio)}</p>
              {v.oracaoPessoal && <p className="mt-1 line-clamp-3 font-serif text-[14px]">{v.oracaoPessoal}</p>}
            </li>))}
          </ul>)}
      </section>

      {nesta && <ConfirmationDialog open={cancelar} onClose={() => setCancelar(false)} perigo titulo="Descartar vigília?"
        texto="O texto desta vigília será apagado e ela não entrará no histórico." confirmar="Descartar" onConfirm={() => { store.cancelarVigilia(nesta.id); setTexto(''); }} />}
    </div>
  );
}
