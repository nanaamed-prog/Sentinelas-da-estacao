'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CreditCard, RefreshCw, Download, CircleCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui/states';
import { ConfirmationDialog } from '@/components/ui/Sheet';
import { useAssinatura, type AssinaturaAtual } from '@/lib/assinatura/cliente';
import { previaEncerrar } from '@/lib/assinatura/buscar';
import { RECURSOS, RECURSOS_COMPLETO, caminhoSeguro, parametro, reais } from '@/lib/assinatura/planos';

const data = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '');

const SITUACAO: Record<AssinaturaAtual['status'], string> = {
  pendente: 'Pagamento aguardando confirmação', ativa: 'Ativa', em_atraso: 'Cobrança pendente',
  suspensa: 'Suspensa', pausada: 'Pausada', cancelada: 'Encerrada', expirada: 'Expirada',
};

export default function MinhaAssinatura() {
  const a = useAssinatura();
  const [msg, setMsg] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmarCancel, setConfirmarCancel] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [voltar, setVoltar] = useState<string | null>(null);
  const tentativas = useRef(0);

  const s = a.assinatura;
  const plano = a.planos.find((p) => p.id === s?.plano_id);
  const vigente = s && ['ativa', 'em_atraso', 'pendente'].includes(s.status);
  const paga = s?.provedor === 'stripe';

  // retorno do checkout: a página NÃO libera nada sozinha — consulta o provedor pelo servidor até a confirmação
  useEffect(() => {
    if (parametro('checkout') !== 'retorno') return;
    let v: string | null = caminhoSeguro(parametro('voltar'), '');
    if (!v) { try { v = caminhoSeguro(sessionStorage.getItem('sentinelas:voltar'), '') || null; } catch { v = null; } }
    setVoltar(v || null);
    setConfirmando(true);
    tentativas.current = 0;
  }, []);
  useEffect(() => {
    if (!confirmando) return;
    if (s && s.status === 'ativa') {
      setConfirmando(false);
      setMsg('Pagamento confirmado. O Sentinelas Completo está liberado na sua conta.');
      try { sessionStorage.removeItem('sentinelas:voltar'); } catch { /* noop */ }
      return;
    }
    if (tentativas.current >= 10) {
      setConfirmando(false);
      setMsg('Ainda não recebemos a confirmação do pagamento. Isso pode levar alguns minutos. Toque em “Atualizar situação” mais tarde; nada precisa ser refeito.');
      return;
    }
    const t = setTimeout(() => { tentativas.current++; void a.sincronizar(); }, tentativas.current ? 3000 : 300);
    return () => clearTimeout(t);
  }, [confirmando, s, a]);

  async function acao(f: () => Promise<string | null>, sucesso: string) {
    setOcupado(true); setMsg(null);
    const erro = await f();
    setOcupado(false);
    setMsg(erro ?? sucesso);
  }

  return (
    <>
      <PageHeader eyebrow="Conta" titulo="Minha assinatura" />
      <div aria-live="polite">
        {confirmando && <p className="mb-4 flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-3 text-[14px]"><RefreshCw size={16} className="animate-spin" /> Confirmando seu pagamento com o Stripe…</p>}
        {msg && <p role="status" className="mb-4 flex gap-2 rounded-xl bg-surface-2 px-4 py-3 text-[14px]"><CircleCheck size={16} className="mt-0.5 shrink-0 text-accent" />{msg}</p>}
      </div>
      {voltar && s?.status === 'ativa' && !confirmando && (
        <Link href={voltar} className="btn-primary mb-4 w-full">Voltar para onde eu estava</Link>
      )}

      {!a.logada ? (
        <p className="card p-5 text-[15px]">Entre na sua conta para ver a sua assinatura. <Link href="/entrar/" className="text-accent underline">Entrar</Link></p>
      ) : !s ? (
        <section className="card p-5">
          <p className="font-display text-lg">Plano gratuito</p>
          <p className="mt-1 text-[14px] text-muted">{a.ativas ? 'Você usa os recursos gratuitos do app.' : 'Neste momento, todos os recursos estão liberados para todas as pessoas.'}</p>
          <Link href="/planos/" className="btn-ghost mt-4 w-full">Conhecer os planos</Link>
        </section>
      ) : (
        <section className="card space-y-3 p-5">
          <div>
            <p className="eyebrow">{s.provedor === 'cortesia' ? 'Acesso de cortesia' : plano?.nome ?? 'Sentinelas Completo'}</p>
            <p className="mt-1 font-display text-xl">{SITUACAO[s.status]}{s.cancelar_no_fim && vigente ? ' · renovação cancelada' : ''}</p>
          </div>
          {paga && plano && vigente && !s.cancelar_no_fim && s.periodo_fim && (
            <p className="text-[14px]">Próxima cobrança em <strong>{data(s.periodo_fim)}</strong>: {reais(plano.valorCentavos)} ({plano.periodicidade === 'mes' ? 'mensal' : 'anual'}).</p>
          )}
          {vigente && s.cancelar_no_fim && s.periodo_fim && (
            <p className="text-[14px]">Seu acesso continua até <strong>{data(s.periodo_fim)}</strong>. Não haverá nova cobrança.</p>
          )}
          {s.status === 'em_atraso' && <p className="text-[14px]">Não foi possível concluir a última cobrança. O Stripe tentará novamente nos próximos dias; enquanto isso, o acesso continua. Se quiser, atualize a forma de pagamento.</p>}
          {s.status === 'pendente' && <p className="text-[14px]">O pagamento ainda não foi confirmado. O acesso é liberado assim que o Stripe confirmar.</p>}
          {(s.status === 'cancelada' || s.status === 'expirada' || s.status === 'suspensa') && (
            <p className="text-[14px]">{s.periodo_fim ? `O acesso ao Sentinelas Completo terminou em ${data(s.periodo_fim)}.` : 'O acesso ao Sentinelas Completo terminou.'} Seus registros continuam guardados.</p>
          )}
          {a.contestacao && <p className="text-[14px]">Há uma contestação de pagamento em análise. Enquanto ela não é concluída, o acesso fica suspenso.</p>}

          <div className="grid gap-2 pt-2">
            {paga && <button className="btn-ghost" disabled={ocupado} onClick={() => acao(a.abrirPortal, '')}><CreditCard size={16} /> Gerenciar pagamento e faturas</button>}
            {paga && vigente && !s.cancelar_no_fim && <button className="btn-ghost" disabled={ocupado} onClick={() => setConfirmarCancel(true)}>Cancelar renovação</button>}
            {paga && vigente && s.cancelar_no_fim && <button className="btn-primary" disabled={ocupado}
              onClick={() => acao(() => a.alterarRenovacao('reativar'), 'Renovação reativada. Nada mais muda no seu acesso.')}>Reativar renovação</button>}
            {!vigente && <Link href="/planos/" className="btn-primary">Ver os planos</Link>}
            <button className="min-h-11 text-[14px] text-accent" disabled={ocupado} onClick={() => acao(async () => { await a.sincronizar(); return null; }, 'Situação atualizada.')}>
              <RefreshCw size={14} className="mr-1 inline" /> Atualizar situação</button>
          </div>
        </section>
      )}

      <section className="mt-5 rounded-xl bg-surface-2/60 p-4 text-[14px]">
        <p className="font-medium">Seus registros são seus</p>
        <p className="mt-1 text-muted">Diário, pedidos, vigílias e testemunhos não são apagados por mudança de plano. Você pode lê-los e exportá-los a qualquer momento.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/diario/" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line/30 px-3 text-[13px]"><Download size={14} /> Exportar o diário</Link>
          <Link href="/configuracoes/" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line/30 px-3 text-[13px]"><Download size={14} /> Exportar todos os dados</Link>
        </div>
      </section>
      {previaEncerrar && <button className="mt-4 min-h-11 w-full text-[13px] text-muted underline" onClick={previaEncerrar}>Prévia: voltar ao plano gratuito</button>}

      <ConfirmationDialog open={confirmarCancel} onClose={() => setConfirmarCancel(false)} titulo="Cancelar a renovação?" confirmar="Cancelar renovação" voltar="Voltar"
        texto={`A assinatura não será renovada${s?.periodo_fim ? ` e o acesso continua até ${data(s.periodo_fim)}` : ''}. Depois disso deixam de estar disponíveis: ${RECURSOS_COMPLETO.map((r) => RECURSOS[r].nome).join(', ')}. Seus registros continuam guardados para leitura e exportação, e você pode voltar a assinar quando quiser.`}
        onConfirm={() => acao(() => a.alterarRenovacao('cancelar'), `Renovação cancelada. Seu acesso continua${s?.periodo_fim ? ` até ${data(s.periodo_fim)}` : ' até o fim do período pago'}.`)} />
    </>
  );
}
