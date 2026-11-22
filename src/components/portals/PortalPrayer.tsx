'use client';
import type { PortalId } from '@/lib/content/portals';
import { ALVO_DA_CATEGORIA } from '@/lib/content/batalha';
import type { PrayerRequest } from '@/lib/store/schema';
import { OracaoBatalha } from './OracaoBatalha';

/** Oração de um portal para um pedido específico — com foco em batalha espiritual. */
export function PortalPrayer({ portal, pedido, acao }: {
  portal: PortalId;
  pedido: Pick<PrayerRequest, 'titulo' | 'pessoaOuAssunto'> & { categoria?: PrayerRequest['categoria'] };
  acao?: React.ReactNode | ((texto: string) => React.ReactNode);
}) {
  return (
    <OracaoBatalha
      key={`${portal}-${pedido.titulo}`}
      portal={portal}
      pedido={{ titulo: pedido.titulo, pessoa: pedido.pessoaOuAssunto }}
      alvoInicial={pedido.categoria ? ALVO_DA_CATEGORIA[pedido.categoria] ?? 'vida' : 'vida'}
      acao={typeof acao === 'function' ? acao : () => acao}
    />
  );
}
