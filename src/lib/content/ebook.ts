import type { SeasonId } from './seasons';

/**
 * Tipos do e-book “Sentinelas da Estação” (Naiara de Medeiros).
 * O texto fica no servidor (src/lib/conteudo-pago) e chega ao app por /api/conteudo/biblioteca.
 */
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
export interface Livro { titulo: string; subtitulo: string; autora: string; edicao: string; capitulos: Capitulo[] }

/** O que o app recebe do servidor: os capítulos liberados para a usuária. */
export interface Biblioteca { livro: Omit<Livro, 'capitulos'>; capitulos: Capitulo[]; completo: boolean }
