import type { ReactNode } from 'react';
export function Field({ label, hint, erro, children, htmlFor }: { label: string; hint?: string; erro?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-muted">{label}</label>
      {children}
      {hint && !erro && <p className="text-xs text-muted/80">{hint}</p>}
      {erro && <p className="text-xs text-[#E79A8F]" role="alert">{erro}</p>}
    </div>
  );
}
