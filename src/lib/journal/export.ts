import { getPortal, nomePortal } from '@/lib/content/portals';
import { getSeason } from '@/lib/content/seasons';
import type { JournalEntry } from '@/lib/store/schema';

/** Texto legível do diário (para guardar, imprimir ou enviar a si mesma). */
export function diarioEmTexto(entradas: JournalEntry[], nome = ''): string {
  const ord = [...entradas].sort((a, b) => a.data.localeCompare(b.data));
  const linhas = [
    'DIÁRIO DA SENTINELA',
    `Sentinelas da Estação${nome ? ` · ${nome}` : ''}`,
    `Exportado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} · ${ord.length} registro${ord.length === 1 ? '' : 's'}`,
    '',
  ];
  for (const e of ord) {
    const d = new Date(e.data).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const meta = [e.tipo, e.referencia, e.estacao && getSeason(e.estacao)?.nome, e.portal && nomePortal(getPortal(e.portal)!)].filter(Boolean).join(' · ');
    linhas.push('────────────────────────', d.charAt(0).toUpperCase() + d.slice(1), `${e.favorito ? '★ ' : ''}${e.titulo}`, meta);
    if (e.marcadores.length) linhas.push(`Marcadores: ${e.marcadores.join(', ')}`);
    linhas.push('', e.texto.trim(), '');
  }
  return linhas.join('\n');
}

export async function compartilharOuBaixar(texto: string, nomeArquivo: string): Promise<'compartilhado' | 'baixado'> {
  const arquivo = new File([texto], nomeArquivo, { type: 'text/plain' });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.share && nav.canShare?.({ files: [arquivo] })) {
    try { await nav.share({ files: [arquivo], title: 'Diário da Sentinela' }); return 'compartilhado'; }
    catch (e) { if ((e as Error).name === 'AbortError') return 'compartilhado'; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(arquivo);
  a.download = nomeArquivo;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return 'baixado';
}
