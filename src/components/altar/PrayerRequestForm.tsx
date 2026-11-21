'use client';
import { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { CATEGORIAS, prayerRequestSchema, type Categoria, type PrayerRequest } from '@/lib/store/schema';
import { PORTALS, type PortalId } from '@/lib/content/portals';

export type RequestDraft = { titulo: string; descricao: string; categoria: Categoria; pessoaOuAssunto: string; portal?: PortalId; prioritario: boolean };

export function PrayerRequestForm({ inicial, onSubmit, rotulo = 'Colocar no altar' }: { inicial?: Partial<PrayerRequest>; onSubmit: (d: RequestDraft) => void; rotulo?: string }) {
  const [d, setD] = useState<RequestDraft>({
    titulo: inicial?.titulo ?? '', descricao: inicial?.descricao ?? '', categoria: inicial?.categoria ?? 'Família',
    pessoaOuAssunto: inicial?.pessoaOuAssunto ?? '', portal: inicial?.portal, prioritario: inicial?.prioritario ?? false,
  });
  const [erro, setErro] = useState<string>();
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault();
      const r = prayerRequestSchema.shape.titulo.safeParse(d.titulo);
      if (!r.success) return setErro(r.error.issues[0]?.message);
      onSubmit({ ...d, titulo: r.data });
    }}>
      <Field label="Título" htmlFor="t" erro={erro}><input id="t" className="field" maxLength={120} value={d.titulo} onChange={(e) => { setD({ ...d, titulo: e.target.value }); setErro(undefined); }} /></Field>
      <Field label="Descrição" htmlFor="ds"><textarea id="ds" rows={3} className="field font-serif" value={d.descricao} onChange={(e) => setD({ ...d, descricao: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria" htmlFor="c"><select id="c" className="field" value={d.categoria} onChange={(e) => setD({ ...d, categoria: e.target.value as Categoria })}>{CATEGORIAS.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Portal" htmlFor="p"><select id="p" className="field" value={d.portal ?? ''} onChange={(e) => setD({ ...d, portal: (e.target.value || undefined) as PortalId | undefined })}>
          <option value="">Nenhum</option>{PORTALS.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></Field>
      </div>
      <Field label="Pessoa ou assunto" htmlFor="pa"><input id="pa" className="field" maxLength={120} value={d.pessoaOuAssunto} onChange={(e) => setD({ ...d, pessoaOuAssunto: e.target.value })} /></Field>
      <label className="flex min-h-11 items-center gap-3 text-[15px]">
        <input type="checkbox" className="h-5 w-5 accent-[#C58B42]" checked={d.prioritario} onChange={(e) => setD({ ...d, prioritario: e.target.checked })} /> Marcar como prioritário
      </label>
      <p className="text-[12px] text-muted">Visibilidade: privada. Só você vê este pedido.</p>
      <button className="btn-primary w-full" type="submit">{rotulo}</button>
    </form>
  );
}
