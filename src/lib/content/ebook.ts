import livro from './ebook.json';
import type { SeasonId } from './seasons';

/** Conteúdo autoral do e-book “Sentinelas da Estação” (Naiara de Medeiros), estruturado para o leitor do app. */
export interface Secao {
  titulo: string;
  subtitulo: string;
  paragrafos: string[];
  leituras: string[];
  destaque: string;
  reflexao: string;
  /** campos de registro (ex.: “Minha estação predominante hoje”) */
  campos?: string[];
}
export interface Capitulo { slug: string; numero: number | null; titulo: string; epigrafe: string; estacao?: SeasonId; secoes: Secao[] }

export const LIVRO = livro as { titulo: string; subtitulo: string; autora: string; edicao: string; capitulos: Capitulo[] };
export const CAPITULOS = LIVRO.capitulos;
export const getCapitulo = (slug: string) => CAPITULOS.find((c) => c.slug === slug);
export const capituloDaEstacao = (id: SeasonId) => CAPITULOS.find((c) => c.estacao === id);
export const oracaoDaEstacao = (id: SeasonId) => capituloDaEstacao(id)?.secoes.find((s) => s.titulo.startsWith('Oração d'));
