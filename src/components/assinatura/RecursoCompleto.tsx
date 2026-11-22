'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { KeyRound } from 'lucide-react';
import { useAssinatura } from '@/lib/assinatura/cliente';
import { RECURSOS, type RecursoId } from '@/lib/assinatura/planos';

/** Endereço dos planos guardando o ponto onde a pessoa estava. */
export function linkPlanos(voltar: string) {
  return `/planos/?voltar=${encodeURIComponent(voltar)}`;
}

/** Aviso discreto: o recurso faz parte do Sentinelas Completo. Sem pressão, sem urgência. */
export function AvisoCompleto({ recurso, compacto }: { recurso: RecursoId; compacto?: boolean }) {
  const caminho = usePathname() ?? '/';
  const r = RECURSOS[recurso];
  return (
    <div className="card flex gap-3 p-4" role="note">
      <KeyRound size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
      <div className="flex-1">
        <p className="text-[14px] font-medium">{r.nome} · Sentinelas Completo</p>
        {!compacto && <p className="mt-1 text-[13px] text-muted">{r.beneficio}</p>}
        <Link href={linkPlanos(caminho)} className="mt-2 inline-flex min-h-10 items-center text-[13px] text-accent underline underline-offset-4">Conhecer os planos</Link>
      </div>
    </div>
  );
}

/** Mostra o conteúdo quando há acesso completo; caso contrário, o aviso discreto. */
export function RecursoCompleto({ recurso, children, compacto }: { recurso: RecursoId; children: ReactNode; compacto?: boolean }) {
  const { completo } = useAssinatura();
  return completo ? <>{children}</> : <AvisoCompleto recurso={recurso} compacto={compacto} />;
}

export function useCompleto() { return useAssinatura().completo; }
