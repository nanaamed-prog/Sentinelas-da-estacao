import { getPortal, nomePortal } from '@/lib/content/portals';
import { getSeason } from '@/lib/content/seasons';
import { JORNADA } from '@/lib/content/journey';
import type { DB } from '@/lib/store/schema';

export type TipoEvento = 'vigilia' | 'diario' | 'estacao' | 'pedido' | 'recalibracao' | 'testemunho' | 'jornada';
export interface Evento { tipo: TipoEvento; quando: string; titulo: string; href: string }

export const ROTULO: Record<TipoEvento, string> = {
  vigilia: 'Vigília', diario: 'Diário', estacao: 'Estação', pedido: 'Pedido', recalibracao: 'Recalibração', testemunho: 'Testemunho', jornada: 'Jornada',
};

/** Chave do dia no fuso local (AAAA-MM-DD). */
export const chaveDia = (d: Date | string) => {
  const x = typeof d === 'string' ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

/** Reúne tudo o que aconteceu, para mostrar no calendário. Não há pontuação: só memória da caminhada. */
export function eventos(db: DB): Evento[] {
  const ev: Evento[] = [];
  for (const v of db.vigilias) if (v.fim) ev.push({ tipo: 'vigilia', quando: v.inicio, titulo: nomePortal(getPortal(v.portal)!), href: `/vigilias/${v.portal}/` });
  for (const e of db.diario) ev.push({ tipo: 'diario', quando: e.data, titulo: `${e.tipo}: ${e.titulo}`, href: '/diario/' });
  for (const s of db.estacoes) { const x = getSeason(s.estacao); ev.push({ tipo: 'estacao', quando: s.inicio, titulo: `Início: ${x?.nome} — ${x?.chamado}`, href: '/estacoes/' }); }
  for (const p of db.pedidos) {
    ev.push({ tipo: 'pedido', quando: p.criadoEm, titulo: p.titulo, href: '/altar/' });
    for (const h of p.historico) if (h.tipo === 'recalibrado') ev.push({ tipo: 'recalibracao', quando: h.em, titulo: p.titulo, href: '/altar/' });
    if (p.respondidoEm) ev.push({ tipo: 'testemunho', quando: p.respondidoEm, titulo: p.titulo, href: '/altar/#respondidos' });
  }
  for (const c of db.jornada ?? []) for (const d of c.dias) if (d.concluidoEm) {
    ev.push({ tipo: 'jornada', quando: d.concluidoEm, titulo: `Dia ${d.dia} — ${JORNADA.find((j) => j.dia === d.dia)?.titulo ?? ''}`, href: '/jornada/' });
  }
  return ev.sort((a, b) => a.quando.localeCompare(b.quando));
}

export function porDia(ev: Evento[]): Map<string, Evento[]> {
  const m = new Map<string, Evento[]>();
  for (const e of ev) { const k = chaveDia(e.quando); m.set(k, [...(m.get(k) ?? []), e]); }
  return m;
}

/** Semanas (domingo a sábado) que cobrem o mês. */
export function gradeDoMes(ano: number, mes: number): (Date | null)[] {
  const primeiro = new Date(ano, mes, 1);
  const dias = new Date(ano, mes + 1, 0).getDate();
  const cel: (Date | null)[] = Array(primeiro.getDay()).fill(null);
  for (let d = 1; d <= dias; d++) cel.push(new Date(ano, mes, d));
  while (cel.length % 7) cel.push(null);
  return cel;
}
