import { BookOpen } from 'lucide-react';
/** Mostra apenas a referência bíblica (sem texto de tradução protegida). */
export function ScriptureReference({ referencia, rotulo = 'Palavra do dia' }: { referencia: string; rotulo?: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line/40 text-accent"><BookOpen size={20} strokeWidth={1.5} /></span>
      <div>
        <p className="eyebrow">{rotulo}</p>
        <p className="font-display text-lg">{referencia}</p>
        <p className="text-[13px] text-muted">Abra sua Bíblia e leia com calma.</p>
      </div>
    </div>
  );
}
