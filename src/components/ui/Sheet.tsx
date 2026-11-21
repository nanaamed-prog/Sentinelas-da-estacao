'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

/** Painel inferior acessível (dialog nativo), confortável para uso com uma mão. */
export function Sheet({ open, onClose, titulo, children }: { open: boolean; onClose: () => void; titulo: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[1.75rem] border-t border-line/30 bg-surface p-0 text-fg backdrop:bg-black/60 sm:mx-auto sm:max-w-lg"
      aria-label={titulo}
    >
      {open && (
        <div className="px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line/40" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl">{titulo}</h2>
            <button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface-2" aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmationDialog({ open, titulo, texto, confirmar = 'Confirmar', perigo, onConfirm, onClose }: {
  open: boolean; titulo: string; texto: string; confirmar?: string; perigo?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} titulo={titulo}>
      <p className="font-serif text-[15px] text-muted">{texto}</p>
      <div className="mt-6 flex flex-col gap-3">
        <button className={perigo ? 'btn bg-vinho text-marfim hover:bg-vinho-600' : 'btn-primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmar}</button>
        <button className="btn-ghost" onClick={onClose}>Cancelar</button>
      </div>
    </Sheet>
  );
}
