'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { PortalId } from '@/lib/content/portals';
import { etapasDaOracao, oracaoDoPortal } from '@/lib/content/prayers';
import type { PrayerRequest } from '@/lib/store/schema';

/** Oração orientada de um portal para um pedido específico. */
export function PortalPrayer({ portal, pedido, acao }: { portal: PortalId; pedido: Pick<PrayerRequest, 'titulo' | 'pessoaOuAssunto'>; acao?: React.ReactNode }) {
  const alvo = { pedido: pedido.titulo, pessoa: pedido.pessoaOuAssunto };
  const etapas = etapasDaOracao(portal, alvo);
  const texto = oracaoDoPortal(portal, alvo);
  const [copiado, setCopiado] = useState(false);
  return (
    <div>
      <ol className="leitura space-y-4 rounded-xl px-4 py-4">
        {etapas.map((e, i) => (
          <li key={e.id}>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8C5C22]">{i + 1}. {e.titulo}</p>
            <p className="mt-1 text-[16px] italic">{e.texto}</p>
          </li>
        ))}
      </ol>
      <div className="mt-2 flex flex-wrap gap-2">
        {acao}
        <button type="button" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line/30 px-3 text-[13px]"
          onClick={async () => { try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch { /* sem permissão */ } }}>
          {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiada' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
