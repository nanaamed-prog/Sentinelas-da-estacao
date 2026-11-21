'use client';
import { useState } from 'react';
import { Field } from '@/components/ui/Field';

const CAMPOS = [
  ['oQueMudou', 'O que mudou?'],
  ['oQuePermanece', 'O que permanece?'],
  ['novaNecessidade', 'Qual nova necessidade surgiu?'],
  ['atitude', 'Qual atitude prática será tomada?'],
] as const;
type R = Record<(typeof CAMPOS)[number][0], string>;

export function RecalibrationForm({ onSubmit }: { onSubmit: (r: R) => void }) {
  const [r, setR] = useState<R>({ oQueMudou: '', oQuePermanece: '', novaNecessidade: '', atitude: '' });
  const vazio = Object.values(r).every((v) => !v.trim());
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!vazio) onSubmit(r); }}>
      <p className="font-serif text-[14px] text-muted">O pedido original é preservado. Esta recalibração entra no histórico.</p>
      {CAMPOS.map(([k, l]) => (
        <Field key={k} label={l} htmlFor={k}><textarea id={k} rows={2} className="field font-serif" value={r[k]} onChange={(e) => setR({ ...r, [k]: e.target.value })} /></Field>
      ))}
      <button className="btn-primary w-full" disabled={vazio} type="submit">Salvar recalibração</button>
    </form>
  );
}
