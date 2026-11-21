export type PortalId = 'imersao' | 'guerra' | 'alvorada' | 'colheita' | 'santidade' | 'sabedoria' | 'ocaso' | 'silencio';

import { CAPITULOS } from './ebook';

export interface Portal {
  id: PortalId;
  hora: number; // 0–23
  nome: string;
  /** "Portal da Alvorada", "Portal do Silêncio" */
  artigo: 'da' | 'do';
  proposito: string;
  /**
   * Texto devocional, referências e oração orientativa vêm do e-book da autora.
   * Enquanto não forem inseridos, a interface mostra o aviso de conteúdo pendente.
   */
  explicacao?: string;
  referencias?: string[];
  oracaoOrientativa?: string;
  /** perguntas para orar e registrar (do e-book) */
  perguntas?: string[];
}

/** Os oito portais exatamente como definidos no método. */
export const PORTALS: Portal[] = [
  { id: 'imersao', hora: 0, nome: 'Imersão', artigo: 'da', proposito: 'Render-se' },
  { id: 'guerra', hora: 3, nome: 'Guerra', artigo: 'da', proposito: 'Interceder' },
  { id: 'alvorada', hora: 6, nome: 'Alvorada', artigo: 'da', proposito: 'Consagrar' },
  { id: 'colheita', hora: 9, nome: 'Colheita', artigo: 'da', proposito: 'Trabalhar' },
  { id: 'santidade', hora: 12, nome: 'Santidade', artigo: 'da', proposito: 'Separar' },
  { id: 'sabedoria', hora: 15, nome: 'Sabedoria', artigo: 'da', proposito: 'Discernir' },
  { id: 'ocaso', hora: 18, nome: 'Ocaso', artigo: 'do', proposito: 'Recalibrar' },
  { id: 'silencio', hora: 21, nome: 'Silêncio', artigo: 'do', proposito: 'Entregar' },
];

// Conteúdo de cada portal vem do capítulo “Os Oito Portais” do e-book
const CAP_PORTAIS = CAPITULOS.find((c) => c.slug === 'as-oito-vigilias');
for (const p of PORTALS) {
  const sec = CAP_PORTAIS?.secoes.find((x) => x.titulo.includes(`Portal ${p.artigo} ${p.nome}`));
  if (sec) { p.explicacao = sec.paragrafos.join(' '); p.referencias = sec.leituras; p.perguntas = sec.campos; }
}

export const getPortal = (id?: string | null) => PORTALS.find((p) => p.id === id);
export const formatHora = (h: number) => `${String(h).padStart(2, '0')}:00`;

/** Portal cujo intervalo de 3h contém o horário informado. */
export function currentPortal(now: Date): Portal {
  const idx = Math.floor(now.getHours() / 3);
  return PORTALS[idx];
}

/**
 * Próximo portal ativo a partir de `now` (estritamente depois da hora cheia atual).
 * Retorna também em quantos minutos ele começa.
 */
export function nextPortal(now: Date, ativos: PortalId[]): { portal: Portal; emMinutos: number } | null {
  const lista = PORTALS.filter((p) => ativos.includes(p.id));
  if (!lista.length) return null;
  const minutosAgora = now.getHours() * 60 + now.getMinutes();
  let melhor: { portal: Portal; emMinutos: number } | null = null;
  for (const p of lista) {
    let diff = p.hora * 60 - minutosAgora;
    if (diff <= 0) diff += 24 * 60;
    if (!melhor || diff < melhor.emMinutos) melhor = { portal: p, emMinutos: diff };
  }
  return melhor;
}

export const nomePortal = (p: Pick<Portal, 'nome' | 'artigo'>) => `Portal ${p.artigo} ${p.nome}`;
