'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Check, ShieldCheck, KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/states';
import { useAssinatura } from '@/lib/assinatura/cliente';
import { RECURSOS, RECURSOS_COMPLETO, RECURSOS_GRATUITOS, caminhoSeguro, parametro, precoPorExtenso, reais, type PlanoId } from '@/lib/assinatura/planos';

export default function Planos() {
  const a = useAssinatura();
  const [periodo, setPeriodo] = useState<PlanoId>('mensal');
  const [voltar, setVoltar] = useState('/');
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const v = caminhoSeguro(parametro('voltar'), '');
    if (v) { setVoltar(v); try { sessionStorage.setItem('sentinelas:voltar', v); } catch { /* noop */ } }
    else { try { setVoltar(caminhoSeguro(sessionStorage.getItem('sentinelas:voltar'), '/')); } catch { /* noop */ } }
    if (parametro('checkout') === 'cancelado') setAviso('O pagamento não foi concluído e nada foi cobrado. Você pode tentar de novo quando quiser.');
  }, []);

  const plano = a.planos.find((p) => p.id === periodo) ?? a.planos[0];
  const vigente = a.assinatura && ['ativa', 'em_atraso', 'pendente'].includes(a.assinatura.status) ? a.assinatura : null;
  const atualCompleto = Boolean(vigente) || (a.ativas && a.completo);

  async function assinar() {
    setEnviando(true); setAviso(null);
    const erro = await a.assinar(periodo, voltar);
    if (erro) { setAviso(erro); setEnviando(false); }
  }

  return (
    <>
      <PageHeader eyebrow="Sentinelas da Estação" titulo="Planos">Escolha como caminhar com o app. Você pode mudar de ideia a qualquer momento.</PageHeader>

      {!a.ativas && (
        <p className="mb-4 rounded-xl bg-surface-2 px-4 py-3 text-[13px]">Neste momento, todos os recursos estão liberados para todas as pessoas. As assinaturas ainda não começaram.</p>
      )}
      {a.modoTeste && <p className="mb-4 rounded-xl border border-ouro/40 px-4 py-3 text-[13px]">Ambiente de teste: nenhum valor real é cobrado.</p>}
      {aviso && <p role="status" className="mb-4 rounded-xl bg-surface-2 px-4 py-3 text-[14px]">{aviso}</p>}

      <fieldset className="mb-5">
        <legend className="eyebrow mb-2">Periodicidade do Sentinelas Completo</legend>
        <div className="grid grid-cols-2 rounded-full border border-line/25 p-1">
          {a.planos.map((p) => (
            <label key={p.id} className={clsx('flex min-h-11 cursor-pointer items-center justify-center rounded-full text-[14px] font-medium focus-within:ring-2 focus-within:ring-ouro',
              periodo === p.id ? 'bg-ouro text-noite' : 'text-muted')}>
              <input type="radio" name="periodo" value={p.id} checked={periodo === p.id} onChange={() => setPeriodo(p.id)} className="sr-only" />
              {p.periodicidade === 'mes' ? 'Mensal' : 'Anual'}
            </label>
          ))}
        </div>
      </fieldset>

      <section className="card mb-4 p-5" aria-labelledby="p-completo">
        <div className="flex items-start justify-between gap-3">
          <h2 id="p-completo" className="font-display text-xl">Sentinelas Completo</h2>
          {atualCompleto && <span className="rounded-full bg-ouro/20 px-2.5 py-1 text-[12px] text-accent">Seu plano atual</span>}
        </div>
        <p className="mt-3 font-display text-[30px] leading-none">{reais(plano.valorCentavos)}<span className="ml-1 font-sans text-[15px] text-muted">{plano.periodicidade === 'mes' ? 'por mês' : 'por ano'}</span></p>
        <p className="mt-2 text-[13px] text-muted">{precoPorExtenso(plano)}.</p>
        <ul className="mt-4 space-y-2.5">
          {RECURSOS_COMPLETO.map((r) => (
            <li key={r} className="flex gap-2.5 text-[14px]"><Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              <span><strong className="font-medium">{RECURSOS[r].nome}.</strong> <span className="text-muted">{RECURSOS[r].beneficio}</span></span></li>
          ))}
          <li className="flex gap-2.5 text-[14px]"><Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden /><span>Tudo do plano gratuito, e novos conteúdos conforme forem publicados.</span></li>
        </ul>

        <div className="mt-5">
          {vigente ? (
            <Link href="/assinatura/" className="btn-ghost w-full">Ver minha assinatura</Link>
          ) : !a.logada ? (
            <Link href="/entrar/" onClick={() => { try { sessionStorage.setItem('sentinelas:apos-entrar', '/planos/'); } catch { /* noop */ } }} className="btn-primary w-full">Entrar para assinar</Link>
          ) : a.checkout && plano.disponivel ? (
            <button className="btn-primary w-full" disabled={enviando} onClick={assinar}>
              <KeyRound size={18} /> {enviando ? 'Abrindo o pagamento…' : `Assinar — ${reais(plano.valorCentavos)} ${plano.periodicidade === 'mes' ? 'por mês' : 'por ano'}`}
            </button>
          ) : (
            <button className="btn-primary w-full" disabled>Assinaturas em breve</button>
          )}
        </div>
        <p className="mt-3 text-[12px] text-muted">
          A assinatura renova automaticamente a cada {plano.periodicidade === 'mes' ? 'mês' : 'ano'} até você cancelar. Você pode cancelar a renovação quando quiser em Minha assinatura e continua com acesso até o fim do período já pago. Seus registros nunca são apagados por causa do plano.
        </p>
      </section>

      <section className="card p-5" aria-labelledby="p-gratis">
        <div className="flex items-start justify-between gap-3">
          <h2 id="p-gratis" className="font-display text-xl">Gratuito</h2>
          {a.ativas && !atualCompleto && <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px]">Seu plano atual</span>}
        </div>
        <p className="mt-3 font-display text-[30px] leading-none">R$ 0</p>
        <ul className="mt-4 space-y-2.5">
          {RECURSOS_GRATUITOS.map((r) => <li key={r} className="flex gap-2.5 text-[14px]"><Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />{r}</li>)}
        </ul>
      </section>

      <p className="mt-5 flex gap-2 text-[12px] text-muted"><ShieldCheck size={16} className="shrink-0 text-accent" aria-hidden />
        O pagamento é feito no ambiente seguro do Stripe. O app não recebe nem guarda os dados do seu cartão.</p>
      {voltar !== '/' && <Link href={voltar} className="mt-4 inline-flex min-h-11 items-center text-[14px] text-accent underline underline-offset-4">Voltar para onde eu estava</Link>}
    </>
  );
}
