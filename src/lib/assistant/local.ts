/**
 * Assistente da Sentinela — modo local (sem IA, nada sai do aparelho).
 * Usa o conteúdo do e-book e os registros da própria usuária.
 * Não fala em nome de Deus, não promete respostas e não interpreta sinais.
 */
import { CAPITULOS, capituloDaEstacao } from '@/lib/content/ebook';
import { PORTALS, formatHora, getPortal, nomePortal, type PortalId } from '@/lib/content/portals';
import { getSeason, type SeasonId } from '@/lib/content/seasons';
import { JORNADA } from '@/lib/content/journey';
import { CATEGORIAS, type DB, type PrayerRequest } from '@/lib/store/schema';

export const AVISO =
  'Sou uma ajuda para organizar sua oração e reflexão. Não falo em nome de Deus, não faço profecias e não substituo aconselhamento pastoral, médico ou psicológico.';

/** Perguntas de reflexão da estação (do e-book) + do portal escolhido. */
export function perguntasDeReflexao(estacao?: SeasonId, portal?: PortalId): { origem: string; perguntas: string[] }[] {
  const grupos: { origem: string; perguntas: string[] }[] = [];
  const cap = estacao ? capituloDaEstacao(estacao) : CAPITULOS.find((c) => c.slug === 'discernindo-sua-estacao');
  if (cap) {
    const qs = cap.secoes.flatMap((s) => (s.campos?.filter((c) => c.endsWith('?')) ?? []).concat(s.reflexao.includes('?') ? s.reflexao.split(/(?<=\?)\s+/).filter((x) => x.endsWith('?')) : []));
    if (qs.length) grupos.push({ origem: cap.titulo, perguntas: [...new Set(qs)].slice(0, 6) });
  }
  const p = portal ? getPortal(portal) : undefined;
  if (p?.perguntas?.length) grupos.push({ origem: nomePortal(p), perguntas: p.perguntas });
  return grupos;
}

const dias = (iso: string, agora: Date) => Math.floor((agora.getTime() - new Date(iso).getTime()) / 86_400_000);

/** Visão organizada do altar: por categoria, por status e pedidos que pedem revisão. */
export function organizarPedidos(pedidos: PrayerRequest[], agora = new Date()) {
  const abertos = pedidos.filter((p) => p.status === 'Em oração' || p.status === 'Em acompanhamento');
  const porCategoria = CATEGORIAS.map((c) => ({ categoria: c, total: abertos.filter((p) => p.categoria === c).length })).filter((x) => x.total);
  const semRevisao = abertos
    .map((p) => ({ p, dias: dias(p.historico.at(-1)?.em ?? p.criadoEm, agora) }))
    .filter((x) => x.dias >= 30)
    .sort((a, b) => b.dias - a.dias);
  const semPortal = abertos.filter((p) => !p.portal);
  const respondidos = pedidos.filter((p) => p.status === 'Respondido');
  const semTestemunho = respondidos.filter((p) => !p.testemunho);
  return { abertos: abertos.length, porCategoria, semRevisao, semPortal, respondidos: respondidos.length, semTestemunho };
}

/** Plano devocional simples para os próximos dias, a partir da estação, dos portais e da jornada. */
export function montarPlano(db: DB) {
  const est = db.estacoes.find((e) => !e.fim)?.estacao;
  const cap = est ? capituloDaEstacao(est) : undefined;
  const portais = PORTALS.filter((p) => db.preferencias.portaisAtivos.includes(p.id));
  const leituras = [...new Set(cap?.secoes.flatMap((s) => s.leituras) ?? ['Salmo 119:105', 'Eclesiastes 3:1-8'])];
  const jornada = [...db.jornada].sort((a, b) => b.ciclo - a.ciclo)[0];
  const proximoDia = JORNADA.find((d) => !jornada?.dias.some((x) => x.dia === d.dia && x.concluidoEm));
  const passos: string[] = [];
  passos.push(portais.length
    ? `Ore nos seus portais: ${portais.map((p) => `${p.nome} (${formatHora(p.hora)})`).join(', ')}.`
    : 'Escolha de um a três portais possíveis para a sua rotina — você não precisa começar pelos oito.');
  if (cap) passos.push(`Leia, um texto por dia, as referências da estação ${getSeason(est)!.nome}: ${leituras.slice(0, 7).join(' • ')}.`);
  else passos.push('Defina sua estação predominante, apenas como referência devocional, para orientar as leituras.');
  if (proximoDia) passos.push(`Continue o Plano de 7 Dias: Dia ${proximoDia.dia} — ${proximoDia.titulo}.`);
  passos.push('Feche cada dia com um registro de “Fechamento do dia”: gratidão, perdão e aprendizado.');
  passos.push('Uma vez por semana, faça a revisão: o que avançou, o que ficou pendente e que padrão você percebeu.');
  return { estacao: est ? getSeason(est) : undefined, capitulo: cap, passos };
}

/** Onde uma referência bíblica aparece no e-book (o app não reproduz o texto bíblico). */
export function ondeAparece(ref: string): { capitulo: string; slug: string; secao: string }[] {
  const alvo = ref.trim().toLowerCase().replace(/^salmos\b/, 'salmo').replace(/\s+/g, ' ');
  if (alvo.length < 3) return [];
  const out: { capitulo: string; slug: string; secao: string }[] = [];
  for (const c of CAPITULOS) for (const s of c.secoes) {
    const norm = (x: string) => x.toLowerCase().replace(/^salmos\b/, 'salmo').replace(/\s+/g, ' ');
    if (s.leituras.some((l) => { const n = norm(l); return n === alvo || n.startsWith(alvo + ':') || n.startsWith(alvo + '-') || (alvo.includes(':') && n.startsWith(alvo)); })) {
      out.push({ capitulo: c.titulo, slug: c.slug, secao: s.titulo });
    }
  }
  return out;
}

export const PERGUNTAS_RECALIBRAR = ['O que mudou?', 'O que permanece?', 'Qual nova necessidade surgiu?', 'Qual atitude prática será tomada?'];
export const ORIENTACAO_RECALIBRAR =
  'Recalibrar significa atualizar sua oração quando novas informações surgem. Não use mudanças como prova automática de uma interpretação espiritual. Registre os fatos e ajuste a oração com humildade.';
