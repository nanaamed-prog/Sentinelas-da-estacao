'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Sparkles, ChevronDown, Send, Trash2, ShieldCheck, NotebookPen } from 'lucide-react';
import { PageHeader } from '@/components/ui/states';
import { PortalPrayer } from '@/components/portals/PortalPrayer';
import { Field } from '@/components/ui/Field';
import { ConfirmationDialog } from '@/components/ui/Sheet';
import { useDB, useNow } from '@/lib/store/provider';
import { useAuth } from '@/lib/auth/provider';
import { getSupabase } from '@/lib/supabase/client';
import { PORTALS, currentPortal, getPortal, nomePortal, type PortalId } from '@/lib/content/portals';
import { getSeason } from '@/lib/content/seasons';
import { AVISO, ORIENTACAO_RECALIBRAR, PERGUNTAS_RECALIBRAR, montarPlano, ondeAparece, organizarPedidos, perguntasDeReflexao } from '@/lib/assistant/local';
import { prepararRascunho } from '@/lib/journal/draft';
import { useRouter } from 'next/navigation';
import { useConteudo } from '@/lib/assinatura/cliente';
import { RecursoCompleto } from '@/components/assinatura/RecursoCompleto';
import type { Biblioteca } from '@/lib/content/ebook';

export default function Assistente() {
  const [modo, setModo] = useState<'local' | 'ia'>('local');
  return (
    <>
      <PageHeader eyebrow="Assistente da Sentinela" titulo="Assistente de Oração" />
      <p className="-mt-3 mb-5 flex gap-2 rounded-xl bg-surface-2/60 p-3 text-[13px] text-muted"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent" />{AVISO}</p>
      <div role="tablist" className="mb-5 grid grid-cols-2 rounded-full border border-line/25 p-1">
        {([['local', 'Modo local'], ['ia', 'IA avançada']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={modo === k} onClick={() => setModo(k)}
            className={clsx('min-h-10 rounded-full text-[13px] font-medium', modo === k ? 'bg-ouro text-noite' : 'text-muted')}>{l}</button>
        ))}
      </div>
      <RecursoCompleto recurso={modo === 'local' ? 'assistente' : 'ia'}>{modo === 'local' ? <ModoLocal /> : <ModoIA />}</RecursoCompleto>
    </>
  );
}

function Bloco({ titulo, desc, children, aberto, onToggle }: { titulo: string; desc: string; children: ReactNode; aberto: boolean; onToggle: () => void }) {
  return (
    <section className={clsx('card overflow-hidden', aberto && 'ring-1 ring-ouro/60')}>
      <button onClick={onToggle} aria-expanded={aberto} className="flex w-full items-center gap-3 p-4 text-left">
        <Sparkles size={18} className="shrink-0 text-accent" />
        <span className="flex-1"><span className="block font-serif text-[16px]">{titulo}</span><span className="block text-[12px] text-muted">{desc}</span></span>
        <ChevronDown size={18} className={clsx('text-muted transition', aberto && 'rotate-180')} />
      </button>
      {aberto && <div className="space-y-3 px-4 pb-5">{children}</div>}
    </section>
  );
}

function ModoLocal() {
  const db = useDB();
  const agora = useNow();
  const router = useRouter();
  const [aberto, setAberto] = useState<string>('oracao');
  const abertos = db.pedidos.filter((p) => p.status === 'Em oração' || p.status === 'Em acompanhamento');
  const [pedidoId, setPedidoId] = useState(abertos[0]?.id ?? '');
  const [portal, setPortal] = useState<PortalId>(currentPortal(agora).id);
  const [ref, setRef] = useState('');
  const pedido = abertos.find((p) => p.id === pedidoId);
  const estacao = db.estacoes.find((e) => !e.fim)?.estacao;
  const { dados: bib } = useConteudo<Biblioteca>('biblioteca');
  const caps = useMemo(() => bib?.capitulos ?? [], [bib]);
  const reflexao = useMemo(() => perguntasDeReflexao(estacao, portal, caps), [estacao, portal, caps]);
  const org = useMemo(() => organizarPedidos(db.pedidos), [db.pedidos]);
  const plano = useMemo(() => montarPlano(db, caps), [db, caps]);
  const achados = useMemo(() => ondeAparece(ref, caps), [ref, caps]);
  const t = (k: string) => () => setAberto(aberto === k ? '' : k);

  const seletorPedido = abertos.length ? (
    <Field label="Pedido" htmlFor="ap"><select id="ap" className="field" value={pedidoId} onChange={(e) => setPedidoId(e.target.value)}>
      {abertos.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}</select></Field>
  ) : <p className="text-[14px] text-muted">Você ainda não tem pedidos em oração. <Link href="/altar/" className="text-accent underline">Abrir Meu Altar</Link></p>;

  return (
    <div className="space-y-3">
      <Bloco titulo="Estruturar uma oração" desc="Para um pedido, no jeito de cada portal" aberto={aberto === 'oracao'} onToggle={t('oracao')}>
        {seletorPedido}
        <Field label="Portal" htmlFor="apo"><select id="apo" className="field" value={portal} onChange={(e) => setPortal(e.target.value as PortalId)}>
          {PORTALS.map((p) => <option key={p.id} value={p.id}>{nomePortal(p)} — {p.proposito}</option>)}</select></Field>
        {pedido && <PortalPrayer portal={portal} pedido={pedido} acao={<Link href={`/vigilias/${portal}/`} className="inline-flex min-h-10 items-center rounded-full bg-ouro px-4 text-[13px] font-medium text-noite">Ir para o portal</Link>} />}
      </Bloco>

      <Bloco titulo="Perguntas de reflexão" desc={estacao ? `Da sua estação (${getSeason(estacao)?.nome}) e do portal` : 'Para discernir o momento'} aberto={aberto === 'reflexao'} onToggle={t('reflexao')}>
        {reflexao.map((g) => (
          <div key={g.origem}>
            <p className="eyebrow">{g.origem}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 font-serif italic">{g.perguntas.map((q) => <li key={q}>{q}</li>)}</ul>
          </div>
        ))}
        <button className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line/40 px-4 text-[13px]"
          onClick={() => { prepararRascunho({ tipo: 'Reflexão livre', titulo: 'Reflexão', texto: reflexao.flatMap((g) => g.perguntas).map((q) => `${q}\n\n`).join(''), referencia: '', marcadores: '' }); router.push('/diario/#novo'); }}>
          <NotebookPen size={14} /> Responder no diário
        </button>
      </Bloco>

      <Bloco titulo="Recalibrar uma oração" desc="Atualizar um pedido com humildade" aberto={aberto === 'recal'} onToggle={t('recal')}>
        <p className="font-serif text-[15px]">{ORIENTACAO_RECALIBRAR}</p>
        {seletorPedido}
        {pedido && <>
          <ul className="list-disc space-y-1 pl-5 font-serif italic">{PERGUNTAS_RECALIBRAR.map((q) => <li key={q}>{q}</li>)}</ul>
          <p className="text-[12px] text-muted">Última atualização: {new Date(pedido.historico.at(-1)?.em ?? pedido.criadoEm).toLocaleDateString('pt-BR')}</p>
          <Link href="/altar/" className="inline-flex min-h-10 items-center rounded-full bg-ouro px-4 text-[13px] font-medium text-noite">Recalibrar no altar</Link>
        </>}
      </Bloco>

      <Bloco titulo="Organizar meus pedidos" desc="Uma visão do seu altar" aberto={aberto === 'org'} onToggle={t('org')}>
        <p className="text-[14px]">{org.abertos} em oração · {org.respondidos} respondidos</p>
        {org.porCategoria.length > 0 && <ul className="flex flex-wrap gap-2">{org.porCategoria.map((c) => <li key={c.categoria} className="rounded-full border border-line/30 px-3 py-1 text-[13px]">{c.categoria}: {c.total}</li>)}</ul>}
        {org.semRevisao.length > 0 && <div><p className="eyebrow">Sem atualização há 30 dias ou mais</p><ul className="mt-1 space-y-1 text-[14px]">{org.semRevisao.slice(0, 5).map(({ p, dias }) => <li key={p.id}>{p.titulo} <span className="text-muted">· {dias} dias</span></li>)}</ul><p className="mt-1 text-[12px] text-muted">Que tal recalibrar um deles?</p></div>}
        {org.semPortal.length > 0 && <p className="text-[13px] text-muted">{org.semPortal.length} pedido(s) sem portal associado — escolha um portal para orar por eles com constância.</p>}
        {org.semTestemunho.length > 0 && <p className="text-[13px] text-muted">{org.semTestemunho.length} resposta(s) sem testemunho escrito. <Link href="/testemunhos/" className="text-accent underline">Registrar</Link></p>}
        {org.abertos === 0 && org.respondidos === 0 && <p className="text-[14px] text-muted">Seu altar ainda está vazio.</p>}
      </Bloco>

      <Bloco titulo="Montar um plano devocional" desc="A partir da sua estação, portais e jornada" aberto={aberto === 'plano'} onToggle={t('plano')}>
        <ol className="list-decimal space-y-2 pl-5 font-serif text-[15px]">{plano.passos.map((p) => <li key={p}>{p}</li>)}</ol>
        {plano.capitulo && <Link href={`/biblioteca/${plano.capitulo.slug}/`} className="text-[13px] text-accent underline">Ler o capítulo “{plano.capitulo.titulo}”</Link>}
      </Bloco>

      <Bloco titulo="Uma referência bíblica" desc="Onde ela aparece no seu e-book" aberto={aberto === 'ref'} onToggle={t('ref')}>
        <Field label="Referência" htmlFor="ref" hint="Ex.: Salmo 46, Tiago 1:5, Provérbios 4:23"><input id="ref" className="field" value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
        {ref.trim().length >= 3 && (achados.length
          ? <ul className="space-y-1">{achados.map((a, i) => <li key={i}><Link href={`/biblioteca/${a.slug}/`} className="text-[14px] text-accent underline">{a.capitulo} — {a.secao}</Link></li>)}</ul>
          : <p className="text-[13px] text-muted">Essa referência não aparece no e-book.</p>)}
        <p className="text-[12px] text-muted">Abra o texto na sua Bíblia e leia o contexto: quem escreveu, para quem e com qual propósito. Para uma explicação mais detalhada, use a IA avançada.</p>
      </Bloco>
    </div>
  );
}

type Msg = { papel: 'user' | 'assistant'; texto: string };

function ModoIA() {
  const auth = useAuth();
  const db = useDB();
  const agora = useNow();
  const sb = getSupabase();
  const [disp, setDisp] = useState<boolean | null>(null);
  const [consent, setConsent] = useState<boolean | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState('');
  const [conversaId, setConversaId] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>();
  const [apagar, setApagar] = useState(false);
  const [ctx, setCtx] = useState({ estacao: true, portal: true, pedidoId: '', objetivo: '' });
  const fim = useRef<HTMLDivElement>(null);
  const estacao = db.estacoes.find((e) => !e.fim)?.estacao;
  const portal = currentPortal(agora);
  const abertos = db.pedidos.filter((p) => p.status === 'Em oração' || p.status === 'Em acompanhamento');

  useEffect(() => { fetch('/api/assistente').then((r) => r.json()).then((d) => setDisp(!!d.disponivel)).catch(() => setDisp(false)); }, []);
  useEffect(() => {
    if (!sb || !auth.session) return;
    sb.from('consent_records').select('concedido').eq('tipo', 'ia_envio_textos').order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setConsent(!!data?.concedido));
  }, [sb, auth.session]);
  useEffect(() => { fim.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  async function mudarConsent(v: boolean) {
    if (!sb || !auth.session) return;
    const { error } = await sb.from('consent_records').insert({ user_id: auth.session.user.id, tipo: 'ia_envio_textos', concedido: v, versao: '2026-11' });
    if (!error) setConsent(v);
  }

  async function enviar() {
    const m = texto.trim();
    if (!m || !auth.session) return;
    setErro(undefined); setEnviando(true); setMsgs((x) => [...x, { papel: 'user', texto: m }]); setTexto('');
    const pedido = abertos.find((p) => p.id === ctx.pedidoId);
    try {
      const r = await fetch('/api/assistente', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.session.access_token}` },
        body: JSON.stringify({
          mensagem: m, conversaId,
          contexto: {
            estacao: ctx.estacao && estacao ? `${getSeason(estacao)?.nome} — ${getSeason(estacao)?.chamado}` : undefined,
            portal: ctx.portal ? `${nomePortal(portal)} — ${portal.proposito}` : undefined,
            pedido: pedido ? `${pedido.titulo} (${pedido.categoria})` : undefined,
            objetivo: ctx.objetivo.trim() || undefined,
          },
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro ?? 'Indisponível agora.');
      setConversaId(d.conversaId);
      setMsgs((x) => [...x, { papel: 'assistant', texto: d.resposta }]);
    } catch (e) { setErro(e instanceof Error ? e.message : 'Indisponível agora.'); }
    finally { setEnviando(false); }
  }

  async function apagarHistorico() {
    if (!sb || !auth.session) return;
    await sb.from('ai_conversations').delete().eq('user_id', auth.session.user.id);
    setMsgs([]); setConversaId(undefined);
  }

  if (!auth.configurado || !auth.session) return <p className="card p-4 text-[14px] text-muted">A IA avançada funciona com a sua conta. O modo local continua disponível sem enviar nada.</p>;
  if (disp === null || consent === null) return <p className="text-[14px] text-muted">Verificando…</p>;
  if (!disp) return (
    <div className="card space-y-2 p-4">
      <p className="font-serif text-[15px]">A IA avançada ainda não foi ativada neste aplicativo.</p>
      <p className="text-[13px] text-muted">Enquanto isso, use o modo local: ele estrutura orações, perguntas e planos sem custo e sem enviar seus textos para fora.</p>
    </div>
  );

  if (!consent) return (
    <div className="card space-y-3 p-4">
      <h2 className="font-display text-lg">Antes de começar</h2>
      <ul className="list-disc space-y-1 pl-5 font-serif text-[14px]">
        <li>Suas mensagens e o contexto que você escolher serão enviados a um serviço externo de IA (Anthropic) para gerar as respostas.</li>
        <li>Seu conteúdo não é usado para treinar modelos por este aplicativo.</li>
        <li>As conversas ficam salvas na sua conta e você pode apagá-las quando quiser.</li>
        <li>A assistente não fala em nome de Deus e não substitui aconselhamento pastoral, médico ou psicológico.</li>
      </ul>
      <button className="btn-primary w-full" onClick={() => void mudarConsent(true)}>Autorizo o envio para a IA</button>
      <p className="text-[12px] text-muted">Você pode retirar a autorização a qualquer momento.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <details className="card p-4">
        <summary className="cursor-pointer text-[14px] text-accent">Contexto que a assistente pode considerar</summary>
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-3 text-[14px]"><input type="checkbox" className="h-5 w-5 accent-[#C58B42]" checked={ctx.estacao} onChange={(e) => setCtx({ ...ctx, estacao: e.target.checked })} /> Minha estação{estacao ? ` (${getSeason(estacao)?.nome})` : ''}</label>
          <label className="flex items-center gap-3 text-[14px]"><input type="checkbox" className="h-5 w-5 accent-[#C58B42]" checked={ctx.portal} onChange={(e) => setCtx({ ...ctx, portal: e.target.checked })} /> Portal atual ({getPortal(portal.id)?.nome})</label>
          <Field label="Pedido (opcional)" htmlFor="ctxp"><select id="ctxp" className="field" value={ctx.pedidoId} onChange={(e) => setCtx({ ...ctx, pedidoId: e.target.value })}>
            <option value="">Nenhum</option>{abertos.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}</select></Field>
          <Field label="Meu objetivo (opcional)" htmlFor="ctxo"><input id="ctxo" className="field" maxLength={400} value={ctx.objetivo} onChange={(e) => setCtx({ ...ctx, objetivo: e.target.value })} placeholder="Ex.: organizar minha oração pela família" /></Field>
          <p className="text-[12px] text-muted">Só o que estiver marcado acima é enviado. Diário e testemunhos não são enviados.</p>
        </div>
      </details>

      <div className="space-y-3">
        {msgs.length === 0 && <p className="text-center font-serif text-[14px] text-muted">Peça ajuda para estruturar uma oração, refletir sobre um texto ou recalibrar um pedido.</p>}
        {msgs.map((m, i) => (
          <div key={i} className={clsx('max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-[15px]', m.papel === 'user' ? 'ml-auto bg-ouro/20' : 'leitura')}>{m.texto}</div>
        ))}
        {enviando && <p className="text-[13px] text-muted">A assistente está escrevendo…</p>}
        <div ref={fim} />
      </div>
      {erro && <p role="alert" className="text-[13px] text-[#E79A8F]">{erro}</p>}
      <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); void enviar(); }}>
        <label htmlFor="msg" className="sr-only">Mensagem</label>
        <textarea id="msg" rows={2} maxLength={2000} className="field flex-1 font-serif" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva sua mensagem" />
        <button className="btn-primary h-12 w-12 !px-0" disabled={enviando || !texto.trim()} aria-label="Enviar"><Send size={18} /></button>
      </form>
      <div className="flex flex-wrap gap-2">
        <button className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line/30 px-4 text-[13px]" onClick={() => setApagar(true)}><Trash2 size={14} /> Apagar histórico</button>
        <button className="inline-flex min-h-10 items-center rounded-full border border-line/30 px-4 text-[13px]" onClick={() => void mudarConsent(false)}>Retirar autorização</button>
      </div>
      <ConfirmationDialog open={apagar} onClose={() => setApagar(false)} perigo titulo="Apagar histórico?" confirmar="Apagar"
        texto="Todas as conversas com a assistente serão apagadas da sua conta." onConfirm={() => void apagarHistorico()} />
    </div>
  );
}
