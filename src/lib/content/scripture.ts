/**
 * Referências do dia. Mostramos apenas a REFERÊNCIA (não o texto),
 * para não reproduzir traduções protegidas sem licença.
 * Lista curta e verificável; a autora pode substituí-la pelo plano do e-book.
 */
export const REFERENCIAS_DO_DIA = [
  'Salmos 119:105',
  'Colossenses 3:23',
  'Lamentações 3:22-23',
  'Eclesiastes 3:1',
  'Habacuque 2:1',
  'Isaías 62:6',
  'Salmos 5:3',
  'Mateus 26:41',
  'João 15:5',
  'Salmos 46:10',
];

export function referenciaDoDia(d: Date): string {
  const inicio = new Date(d.getFullYear(), 0, 0).getTime();
  const dia = Math.floor((d.getTime() - inicio) / 86_400_000);
  return REFERENCIAS_DO_DIA[dia % REFERENCIAS_DO_DIA.length];
}
