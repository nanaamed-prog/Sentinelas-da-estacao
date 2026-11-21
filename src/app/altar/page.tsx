'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Plus, HandHeart } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/states';
import { Sheet, ConfirmationDialog } from '@/components/ui/Sheet';
import { Field } from '@/components/ui/Field';
import { PrayerRequestCard } from '@/components/altar/PrayerRequestCard';
import { PrayerRequestForm } from '@/components/altar/PrayerRequestForm';
import { RecalibrationForm } from '@/components/altar/RecalibrationForm';
import { useDB, useStore } from '@/lib/store/provider';
import { STATUS, type PrayerRequest, type Status } from '@/lib/store/schema';
import { PORTALS, currentPortal, getPortal, nomePortal, type PortalId } from '@/lib/content/portals';
import { PortalPrayer } from '@/components/portals/PortalPrayer';
import Link from 'next/link';
import { dataCurta } from '@/lib/utils/format';

const ABAS = [['abertos', 'Em oração'], ['respondidos', 'Respondidos'], ['todos', 'Todos']] as const;
type Aba = (typeof ABAS)[number][0];

export default function Altar() {
  const db = useDB();
  const store = useStore();
  const [aba, setAba] = useState<Aba>('abertos');
  const [novo, setNovo] = useState(false);
  const [abertoId, setAbertoId] = useState<string>();
  const aberto = db.pedidos.find((p) => p.id === abertoId);

  useEffect(() => { if (location.hash.includes('respondidos')) setAba('respondidos'); }, []);

  const lista = db.pedidos.filter((p) =>
    aba === 'todos' ? true : aba === 'respondidos' ? p.status === 'Respondido' : p.status === 'Em oração' || p.status === 'Em acompanhamento');
  const respondidos = db.pedidos.filter((p) => p.status === 'Respondido').length;

  return (
    <>
      <PageHeader eyebrow="Intercessão" titulo="Meu Altar">{db.pedidos.length} {db.pedidos.length === 1 ? 'pedido' : 'pedidos'} · {respondidos} {respondidos === 1 ? 'respondido' : 'respondidos'}</PageHeader>

      <div role="tablist" className="mb-4 grid grid-cols-3 rounded-full border border-line/25 p-1">
        {ABAS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={aba === k} onClick={() => setAba(k)}
            className={clsx('min-h-10 rounded-full text-[13px] font-medium transition', aba === k ? 'bg-ouro text-noite' : 'text-muted')}>{l}</button>
        ))}
      </div>

      {lista.length === 0 ? (
        <EmptyState icone={<HandHeart size={36} strokeWidth={1.3} />}
          titulo={aba === 'respondidos' ? 'Nenhum testemunho ainda' : 'Seu altar está vazio'}
          texto={aba === 'respondidos' ? 'Quando marcar um pedido como respondido, ele aparece aqui com seu testemunho.' : 'Registre o que está no seu coração. Seus pedidos são privados.'}
          acao={aba !== 'respondidos' && <button className="btn-primary" onClick={() => setNovo(true)}><Plus size={18} /> Novo pedido</button>} />
      ) : (
        <ul className="space-y-2.5">{lista.map((p) => <li key={p.id}><PrayerRequestCard p={p} onOpen={() => setAbertoId(p.id)} /></li>)}</ul>
      )}

      {lista.length > 0 && (
        <button className="btn-primary fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2" onClick={() => setNovo(true)}>
          <Plus size={18} /> Novo pedido de oração
        </button>
      )}

      <Sheet open={novo} onClose={() => setNovo(false)} titulo="Novo pedido">
        <PrayerRequestForm onSubmit={(d) => {
          store.criarPedido({ ...d, estacao: db.estacoes.find((e) => !e.fim)?.estacao });
          setNovo(false); setAba('abertos');
        }} />
      </Sheet>

      <Sheet open={!!aberto} onClose={() => setAbertoId(undefined)} titulo={aberto?.titulo ?? ''}>
        {aberto && <Detalhe p={aberto} onExcluido={() => setAbertoId(undefined)} />}
      </Sheet>
    </>
  );
}

function Detalhe({ p, onExcluido }: { p: PrayerRequest; onExcluido: () => void }) {
  const store = useStore();
  const [modo, setModo] = useState<'ver' | 'editar' | 'recalibrar' | 'responder'>('ver');
  const [testemunho, setTestemunho] = useState(p.testemunho ?? '');
  const [excluir, setExcluir] = useState(false);
  const [portalOracao, setPortalOracao] = useState<PortalId>(() => p.portal ?? currentPortal(new Date()).id);

  if (modo === 'editar') return <PrayerRequestForm inicial={p} rotulo="Salvar alterações" onSubmit={(d) => { store.editarPedido(p.id, d); setModo('ver'); }} />;
  if (modo === 'recalibrar') return <RecalibrationForm onSubmit={(r) => { store.recalibrar(p.id, r); setModo('ver'); }} />;
  if (modo === 'responder') return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); store.mudarStatus(p.id, 'Respondido', testemunho.trim() || undefined); setModo('ver'); }}>
      <Field label="Testemunho (opcional)" htmlFor="tt" hint="Registre como você percebeu a resposta.">
        <textarea id="tt" rows={5} className="field font-serif" value={testemunho} onChange={(e) => setTestemunho(e.target.value)} />
      </Field>
      <button className="btn-primary w-full" type="submit">Marcar como respondido</button>
    </form>
  );

  return (
    <div className="space-y-5">
      <div className="text-[13px] text-muted">
        <p>{p.categoria}{p.pessoaOuAssunto && ` · ${p.pessoaOuAssunto}`}{p.portal && ` · ${nomePortal(getPortal(p.portal)!)}`}</p>
        <p>Criado em {dataCurta(p.criadoEm)}{p.respondidoEm && ` · Respondido em ${dataCurta(p.respondidoEm)}`}</p>
      </div>
      {p.descricao && <p className="leitura rounded-xl px-4 py-3">{p.descricao}</p>}
      {p.testemunho && <div className="rounded-xl border border-ouro/40 px-4 py-3"><p className="eyebrow">Testemunho</p><p className="mt-1 font-serif">{p.testemunho}</p></div>}

      <Field label="Status" htmlFor="st">
        <select id="st" className="field" value={p.status} onChange={(e) => {
          const s = e.target.value as Status;
          if (s === 'Respondido') setModo('responder'); else store.mudarStatus(p.id, s);
        }}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <button className="btn-primary" onClick={() => setModo('recalibrar')}>Recalibrar</button>
        <button className="btn-ghost" onClick={() => setModo('editar')}>Editar</button>
      </div>

      <section>
        <h3 className="font-display text-base">Orar por este pedido</h3>
        <p className="mt-1 text-[13px] text-muted">Escolha o portal: cada um molda a oração pela sua intenção.</p>
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Portal da oração">
          {PORTALS.map((pt) => (
            <button key={pt.id} type="button" onClick={() => setPortalOracao(pt.id)} aria-pressed={portalOracao === pt.id}
              className={clsx('min-h-10 shrink-0 rounded-full border px-3 text-[13px]', portalOracao === pt.id ? 'border-ouro bg-ouro text-noite' : 'border-line/30 text-muted')}>
              {String(pt.hora).padStart(2, '0')}h · {pt.nome}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-accent">{nomePortal(getPortal(portalOracao)!)} — {getPortal(portalOracao)!.proposito}</p>
        <div className="mt-2">
          <PortalPrayer portal={portalOracao} pedido={p} acao={
            <Link href={`/vigilias/${portalOracao}/`} className="inline-flex min-h-10 items-center rounded-full bg-ouro px-4 text-[13px] font-medium text-noite">Ir para o portal</Link>} />
        </div>
      </section>

      <section>
        <h3 className="font-display text-base">Histórico</h3>
        <ol className="mt-2 space-y-3 border-l border-line/30 pl-4">
          {[...p.historico].reverse().map((h) => (
            <li key={h.id} className="text-[14px]">
              <p className="text-[12px] text-muted">{dataCurta(h.em)}</p>
              {h.tipo === 'criado' && <p>Pedido colocado no altar.</p>}
              {h.tipo === 'status' && <p>Status alterado para <strong>{h.status}</strong>.</p>}
              {h.tipo === 'recalibrado' && (
                <div className="mt-1 space-y-1 font-serif">
                  <p className="font-sans font-medium">Recalibração</p>
                  {h.oQueMudou && <p><span className="text-muted">Mudou:</span> {h.oQueMudou}</p>}
                  {h.oQuePermanece && <p><span className="text-muted">Permanece:</span> {h.oQuePermanece}</p>}
                  {h.novaNecessidade && <p><span className="text-muted">Nova necessidade:</span> {h.novaNecessidade}</p>}
                  {h.atitude && <p><span className="text-muted">Atitude:</span> {h.atitude}</p>}
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      <button className="min-h-11 w-full text-sm text-[#E79A8F]" onClick={() => setExcluir(true)}>Excluir pedido</button>
      <ConfirmationDialog open={excluir} onClose={() => setExcluir(false)} perigo titulo="Excluir pedido?" confirmar="Excluir"
        texto="O pedido e todo o seu histórico serão apagados deste aparelho." onConfirm={() => { store.excluirPedido(p.id); onExcluido(); }} />
    </div>
  );
}
