import { Star } from 'lucide-react';
import type { PrayerRequest } from '@/lib/store/schema';
import { dataCurta } from '@/lib/utils/format';

export function PrayerRequestCard({ p, onOpen }: { p: PrayerRequest; onOpen: () => void }) {
  const recal = p.historico.filter((h) => h.tipo === 'recalibrado').length;
  return (
    <button onClick={onOpen} className="card block w-full p-4 text-left transition hover:bg-surface-2">
      <div className="flex items-start gap-2">
        <p className="flex-1 font-serif text-[16px]">{p.titulo}</p>
        {p.prioritario && <Star size={16} className="mt-1 fill-ouro text-ouro" aria-label="Prioritário" />}
      </div>
      <p className="mt-0.5 text-[12px] text-accent">{p.categoria}{p.pessoaOuAssunto && ` · ${p.pessoaOuAssunto}`}</p>
      <p className="mt-2 text-[12px] text-muted">Criado em {dataCurta(p.criadoEm)} · {p.status}{recal ? ` · ${recal} recalibração${recal > 1 ? 'ões' : ''}` : ''}</p>
    </button>
  );
}
