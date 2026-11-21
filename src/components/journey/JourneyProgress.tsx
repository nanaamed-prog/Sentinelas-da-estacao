import clsx from 'clsx';
import type { JornadaCiclo } from '@/lib/store/schema';

/** Progresso do plano — sem pontuação: apenas quais dias foram vividos. */
export function JourneyProgress({ ciclo, total = 7, compacto }: { ciclo?: JornadaCiclo; total?: number; compacto?: boolean }) {
  const feitos = new Set(ciclo?.dias.filter((d) => d.concluidoEm).map((d) => d.dia));
  return (
    <div>
      <ol className="flex gap-1.5" aria-label={`${feitos.size} de ${total} dias concluídos`}>
        {Array.from({ length: total }, (_, i) => i + 1).map((d) => (
          <li key={d} className={clsx('h-1.5 flex-1 rounded-full', feitos.has(d) ? 'bg-ouro' : 'bg-line/25')} />
        ))}
      </ol>
      {!compacto && <p className="mt-2 text-[12px] text-muted">{feitos.size} de {total} dias concluídos</p>}
    </div>
  );
}
