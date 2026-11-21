'use client';
import Link from 'next/link';
import { Flame, ChevronRight, HandHeart, NotebookPen, Route, Sparkles } from 'lucide-react';
import { WatchtowerHero } from '@/components/brand/Watchtower';
import { JourneyProgress } from '@/components/journey/JourneyProgress';
import { JORNADA } from '@/lib/content/journey';
import { ScriptureReference } from '@/components/ui/ScriptureReference';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { useDB, useNow } from '@/lib/store/provider';
import { currentPortal, formatHora, getPortal, nextPortal, nomePortal } from '@/lib/content/portals';
import { getSeason } from '@/lib/content/seasons';
import { referenciaDoDia } from '@/lib/content/scripture';
import { dataCurta, dataLonga, emQuanto, saudacao } from '@/lib/utils/format';

export default function MinhaTorre() {
  const db = useDB();
  const now = useNow();
  const { nome, portaisAtivos } = db.preferencias;
  const estacaoRec = db.estacoes.find((e) => !e.fim);
  const estacao = getSeason(estacaoRec?.estacao);
  const proximo = nextPortal(now, portaisAtivos);
  const agora = currentPortal(now);
  const emAndamento = db.vigilias.find((v) => !v.fim);
  const hoje = now.toDateString();
  const vigiliasHoje = db.vigilias.filter((v) => v.fim && new Date(v.inicio).toDateString() === hoje).length;
  const abertos = db.pedidos.filter((p) => p.status === 'Em oração' || p.status === 'Em acompanhamento');
  const prioritario = abertos.find((p) => p.prioritario) ?? abertos[0];
  const ultimo = [...db.diario].sort((a, b) => b.data.localeCompare(a.data))[0];
  const portalIniciar = emAndamento ? getPortal(emAndamento.portal)! : agora;
  const jornada = [...db.jornada].sort((a, b) => b.ciclo - a.ciclo)[0];
  const proximoDia = jornada ? JORNADA.find((d) => !jornada.dias.some((x) => x.dia === d.dia && x.concluidoEm))?.dia : undefined;

  return (
    <div className="space-y-4">
      {/* A Torre */}
      <section className="relative -mx-5 -mt-4 overflow-hidden">
        <WatchtowerHero estacao={estacaoRec?.estacao} className="h-[230px] w-full" />
        <div className="absolute inset-x-5 bottom-3 animate-fade-up">
          <p className="text-[13px] text-marfim/75 first-letter:uppercase">{dataLonga(now)}</p>
          <h1 className="font-display text-[28px] leading-tight text-marfim">{saudacao(now)}{nome ? `, ${nome}` : ''}</h1>
          <p className="mt-0.5 font-serif text-[14px] text-ouro-300">
            {estacao ? <>Estação: {estacao.nome} — {estacao.chamado}</> : <Link href="/estacoes/" className="underline underline-offset-4">Escolha sua estação</Link>}
          </p>
        </div>
      </section>

      {/* Iniciar oração */}
      <Link href={`/vigilias/${portalIniciar.id}/`} className="card flex items-center gap-4 p-4 shadow-glow">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-ouro text-noite"><Flame size={22} /></span>
        <span className="flex-1">
          <span className="eyebrow block">{emAndamento ? 'Vigília em andamento' : 'Iniciar oração'}</span>
          <span className="block font-display text-lg">{nomePortal(portalIniciar)}</span>
          <span className="block text-[13px] text-muted">{portalIniciar.proposito} · {formatHora(portalIniciar.hora)}</span>
        </span>
        <ChevronRight className="text-muted" size={18} />
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="eyebrow">Próximo portal</p>
          {proximo ? (<>
            <p className="mt-1 font-display text-xl">{formatHora(proximo.portal.hora)}</p>
            <p className="text-[13px]">{proximo.portal.nome}</p>
            <p className="text-[12px] text-muted">{emQuanto(proximo.emMinutos)}</p>
          </>) : <Link href="/vigilias/" className="mt-1 block text-[13px] text-muted underline underline-offset-4">Escolher portais</Link>}
        </div>
        <div className="card p-4">
          <p className="eyebrow">Vigílias de hoje</p>
          <p className="mt-1 font-display text-xl">{vigiliasHoje}</p>
          <p className="text-[12px] text-muted">{vigiliasHoje === 1 ? 'registrada' : 'registradas'}</p>
        </div>
      </div>

      <div className="card p-4"><ScriptureReference referencia={referenciaDoDia(now)} /></div>

      <InstallPrompt compacto />

      <Resumo href="/altar/" Icon={HandHeart} eyebrow="Pedido do altar"
        titulo={prioritario?.titulo} sub={prioritario ? `${prioritario.categoria} · ${prioritario.status}` : undefined}
        vazio="Nenhum pedido em oração. Registre o primeiro no seu altar." />

      <Resumo href="/diario/" Icon={NotebookPen} eyebrow="Última anotação"
        titulo={ultimo?.titulo} sub={ultimo ? `${ultimo.tipo} · ${dataCurta(ultimo.data)}` : undefined}
        vazio="Seu diário ainda está em branco." />

      <div className="grid grid-cols-2 gap-3">
        <Link href="/jornada/" className="card block p-4">
          <Route size={20} strokeWidth={1.5} className="text-accent" />
          <p className="mt-2 text-[14px] font-medium">Plano de 7 dias</p>
          {jornada ? <>
            <p className="mb-2 text-[12px] text-muted">{proximoDia ? `Dia ${proximoDia}: ${JORNADA[proximoDia - 1].titulo}` : 'Concluído'}</p>
            <JourneyProgress ciclo={jornada} compacto />
          </> : <p className="text-[12px] text-muted">Começar a jornada</p>}
        </Link>
        <Link href="/assistente/" className="card block p-4">
          <Sparkles size={20} strokeWidth={1.5} className="text-accent" />
          <p className="mt-2 text-[14px] font-medium">Assistente da Sentinela</p>
          <p className="text-[12px] text-muted">Ajuda para orar e refletir</p>
        </Link>
      </div>
    </div>
  );
}

function Resumo({ href, Icon, eyebrow, titulo, sub, vazio }: { href: string; Icon: typeof Flame; eyebrow: string; titulo?: string; sub?: string; vazio: string }) {
  return (
    <Link href={href} className="card flex items-center gap-4 p-4">
      <Icon size={22} strokeWidth={1.5} className="shrink-0 text-accent" />
      <span className="min-w-0 flex-1">
        <span className="eyebrow block">{eyebrow}</span>
        {titulo ? <>
          <span className="block truncate font-serif text-[16px]">{titulo}</span>
          <span className="block text-[12px] text-muted">{sub}</span>
        </> : <span className="block font-serif text-[14px] text-muted">{vazio}</span>}
      </span>
      <ChevronRight className="text-muted" size={18} />
    </Link>
  );
}
