'use client';
import { useState } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/states';
import { SeasonCard, SeasonSelector } from '@/components/seasons/SeasonCard';
import { Sheet } from '@/components/ui/Sheet';
import { Field } from '@/components/ui/Field';
import { getSeason, type SeasonId } from '@/lib/content/seasons';
import { useDB, useStore } from '@/lib/store/provider';
import { dataCurta } from '@/lib/utils/format';
import type { SeasonRecord } from '@/lib/store/schema';

export default function Estacoes() {
  const db = useDB();
  const store = useStore();
  const atual = db.estacoes.find((e) => !e.fim);
  const anteriores = db.estacoes.filter((e) => e.fim);
  const [trocar, setTrocar] = useState(false);
  const [escolha, setEscolha] = useState<SeasonId>();
  const [motivos, setMotivos] = useState('');
  const [inicio, setInicio] = useState(() => new Date().toISOString().slice(0, 10));

  function confirmar() {
    if (!escolha) return;
    store.escolherEstacao(escolha, { motivos, inicio: new Date(inicio + 'T12:00:00').toISOString() });
    setTrocar(false); setEscolha(undefined); setMotivos('');
  }

  return (
    <>
      <PageHeader eyebrow="As quatro estações" titulo="Estações">Cada estação tem um propósito. Nenhuma é melhor que a outra.</PageHeader>

      {atual ? (
        <div className="space-y-4">
          <SeasonCard id={atual.estacao} selecionada />
          <p className="text-[13px] text-muted">Desde {dataCurta(atual.inicio)}</p>
          <Temas id={atual.estacao} />
          <Revisao key={atual.id} rec={atual} />
          <button className="btn-ghost w-full" onClick={() => setTrocar(true)}>Mudar de estação</button>
        </div>
      ) : (
        <EmptyState titulo="Qual é a sua estação?" texto="Escolha a estação que mais conversa com o seu momento. Você pode revisar quando quiser."
          acao={<button className="btn-primary" onClick={() => setTrocar(true)}>Escolher estação</button>} />
      )}

      <section className="mt-8">
        <h2 className="font-display text-lg">Histórico de estações</h2>
        {anteriores.length === 0 ? <p className="mt-2 font-serif text-[14px] text-muted">As estações anteriores ficam guardadas aqui.</p> : (
          <ul className="mt-3 space-y-2">{anteriores.map((e) => (
            <li key={e.id} className="card p-4">
              <p className="font-display">{getSeason(e.estacao)?.nome} — {getSeason(e.estacao)?.chamado}</p>
              <p className="text-[12px] text-muted">{dataCurta(e.inicio)} até {dataCurta(e.fim!)}</p>
              {e.reflexao && <p className="mt-2 line-clamp-3 font-serif text-[14px]">{e.reflexao}</p>}
            </li>))}
          </ul>)}
      </section>

      <Sheet open={trocar} onClose={() => setTrocar(false)} titulo="Escolher estação">
        <SeasonSelector valor={escolha} onChange={setEscolha} />
        <div className="mt-5 space-y-4">
          <Field label="Data de início" htmlFor="inicio"><input id="inicio" type="date" className="field" value={inicio} onChange={(e) => setInicio(e.target.value)} /></Field>
          <Field label="Por que esta estação?" htmlFor="motivos"><textarea id="motivos" rows={3} className="field font-serif" value={motivos} onChange={(e) => setMotivos(e.target.value)} /></Field>
          {atual && <p className="text-[12px] text-muted">A estação atual será guardada no histórico.</p>}
          <button className="btn-primary w-full" disabled={!escolha} onClick={confirmar}>Confirmar estação</button>
        </div>
      </Sheet>
    </>
  );
}

function Temas({ id }: { id: SeasonId }) {
  const s = getSeason(id)!;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Temas da estação">
      {s.temas.map((t) => <li key={t} className="rounded-full border border-line/30 px-3 py-1 text-[13px]">{t}</li>)}
    </ul>
  );
}

const CAMPOS = [
  ['motivos', 'Motivos da escolha'],
  ['reflexao', 'Reflexões'],
  ['desafios', 'Desafios que identifico'],
  ['atitudes', 'Atitudes práticas'],
] as const;

function Revisao({ rec }: { rec: SeasonRecord }) {
  const store = useStore();
  const [v, setV] = useState({ motivos: rec.motivos, reflexao: rec.reflexao, desafios: rec.desafios, atitudes: rec.atitudes });
  const [salvo, setSalvo] = useState(false);
  return (
    <form className="card space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); store.revisarEstacao(rec.id, v); setSalvo(true); setTimeout(() => setSalvo(false), 2000); }}>
      <h2 className="font-display text-lg">Revisar minha estação</h2>
      {CAMPOS.map(([k, l]) => (
        <Field key={k} label={l} htmlFor={k}>
          <textarea id={k} rows={3} className="field font-serif" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
        </Field>
      ))}
      <button className="btn-primary w-full" type="submit">{salvo ? 'Salvo ✓' : 'Salvar revisão'}</button>
    </form>
  );
}
