import type { TipoDiario } from '@/lib/store/schema';

export const RASCUNHO = 'sentinelas:rascunho-diario';
export interface Rascunho { tipo: TipoDiario; titulo: string; texto: string; referencia: string; marcadores: string }

/** Prepara um rascunho no diário (usado pela Biblioteca para “Registrar no meu diário”). */
export function prepararRascunho(r: Rascunho) {
  try { localStorage.setItem(RASCUNHO, JSON.stringify(r)); } catch { /* armazenamento indisponível */ }
}
