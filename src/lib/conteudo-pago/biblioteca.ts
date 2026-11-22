/**
 * CONTEÚDO DO PLANO COMPLETO — somente no servidor (entregue por /api/conteudo/biblioteca após verificar o acesso).
 * Nunca importar em componentes do navegador.
 */
import livro from './ebook.json';
import type { Livro } from '@/lib/content/ebook';

export const LIVRO = livro as Livro;
export const CAPITULOS = LIVRO.capitulos;
