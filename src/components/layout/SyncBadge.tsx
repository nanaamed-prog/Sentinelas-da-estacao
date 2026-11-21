'use client';
import { Cloud, CloudOff, RefreshCw, CloudAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth/provider';

const INFO = {
  sincronizado: { Icon: Cloud, rotulo: 'Tudo salvo na sua conta', cls: 'text-muted' },
  sincronizando: { Icon: RefreshCw, rotulo: 'Sincronizando…', cls: 'text-accent animate-spin' },
  pendente: { Icon: RefreshCw, rotulo: 'Alterações aguardando envio', cls: 'text-accent' },
  offline: { Icon: CloudOff, rotulo: 'Sem conexão — salvo no aparelho, envio quando a internet voltar', cls: 'text-accent' },
  erro: { Icon: CloudAlert, rotulo: 'Não foi possível sincronizar — tentando de novo', cls: 'text-[#E79A8F]' },
} as const;

export function SyncBadge() {
  const { configurado, session, sync } = useAuth();
  if (!configurado || !session) return null;
  const { Icon, rotulo, cls } = INFO[sync];
  return (
    <span className="grid h-11 w-9 place-items-center" title={rotulo} role="status" aria-label={rotulo}>
      <Icon size={17} strokeWidth={1.6} className={cls} />
    </span>
  );
}
