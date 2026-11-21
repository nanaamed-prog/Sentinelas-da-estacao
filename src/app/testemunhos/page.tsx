'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Star, PenLine } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/states';
import { Sheet } from '@/components/ui/Sheet';
import { Field } from '@/components/ui/Field';
import { useDB, useStore } from '@/lib/store/provider';
import type { PrayerRequest } from '@/lib/store/schema';
import { dataCurta } from '@/lib/utils/format';

export default function Testemunhos() {
  const db = useDB();
  const store = useStore();
  const respondidos = db.pedidos.filter((p) => p.status === 'Respondido')
    .sort((a, b) => (b.respondidoEm ?? b.atualizadoEm).localeCompare(a.respondidoEm ?? a.atualizadoEm));
  const [editando, setEditando] = useState<PrayerRequest>();
  const [texto, setTexto] = useState('');

  return (
    <>
      <PageHeader eyebrow="Memorial" titulo="Testemunhos">O que Deus fez, guardado para lembrar.</PageHeader>

      {respondidos.length === 0 ? (
        <EmptyState icone={<Star size={34} strokeWidth={1.3} />} titulo="Ainda não há testemunhos"
          texto="Quando você marcar um pedido como respondido no seu altar, ele aparece aqui com o seu testemunho."
          acao={<Link href="/altar/" className="btn-primary">Ir para Meu Altar</Link>} />
      ) : (
        <ul className="space-y-3">
          {respondidos.map((p) => (
            <li key={p.id} className="card p-4">
              <p className="text-[12px] text-accent">{p.categoria}{p.respondidoEm && ` · respondido em ${dataCurta(p.respondidoEm)}`}</p>
              <h2 className="mt-0.5 font-display text-lg">{p.titulo}</h2>
              {p.testemunho
                ? <p className="leitura mt-3 whitespace-pre-line rounded-xl px-4 py-3">{p.testemunho}</p>
                : <p className="mt-2 font-serif text-[14px] text-muted">Sem testemunho escrito ainda.</p>}
              <p className="mt-2 text-[12px] text-muted">Em oração desde {dataCurta(p.criadoEm)}</p>
              <button className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line/40 px-4 text-[13px]"
                onClick={() => { setEditando(p); setTexto(p.testemunho ?? ''); }}>
                <PenLine size={14} /> {p.testemunho ? 'Editar testemunho' : 'Escrever testemunho'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!editando} onClose={() => setEditando(undefined)} titulo={editando?.titulo ?? ''}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (editando) store.editarPedido(editando.id, { testemunho: texto.trim() || undefined }); setEditando(undefined); }}>
          <Field label="Meu testemunho" htmlFor="tt" hint="Como você percebeu a resposta? O que aprendeu no caminho?">
            <textarea id="tt" rows={8} className="field font-serif" maxLength={8000} value={texto} onChange={(e) => setTexto(e.target.value)} />
          </Field>
          <button className="btn-primary w-full" type="submit">Salvar testemunho</button>
        </form>
      </Sheet>
    </>
  );
}
