'use client';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Plus, Search, Star, NotebookPen, Share2 } from 'lucide-react';
import { diarioEmTexto, compartilharOuBaixar } from '@/lib/journal/export';
import { PageHeader, EmptyState } from '@/components/ui/states';
import { Sheet, ConfirmationDialog } from '@/components/ui/Sheet';
import { Field } from '@/components/ui/Field';
import { useDB, useStore } from '@/lib/store/provider';
import { TIPOS_DIARIO, type JournalEntry, type TipoDiario } from '@/lib/store/schema';
import { dataCurta } from '@/lib/utils/format';
import { RASCUNHO } from '@/lib/journal/draft';
import { JournalAttachments } from '@/components/journal/JournalAttachments';
import { removerDoRegistro } from '@/lib/attachments/anexos';
import { getSupabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/provider';
import { AvisoCompleto, useCompleto } from '@/components/assinatura/RecursoCompleto';

/** Modelos de escrita orientada. */
const MODELOS: Partial<Record<TipoDiario, string[]>> = {
  Discernimento: ['O que aconteceu?', 'Como me sinto?', 'O que estou interpretando?', 'O que a Palavra deixa claro?', 'Que conselho preciso buscar?', 'Qual é o próximo passo prudente?'],
  // do capítulo “Diário da Sentinela”
  Palavra: ['Texto bíblico', 'Verdade central', 'O que preciso obedecer?'],
  'Fechamento do dia': ['Pelo que agradeço?', 'Onde preciso pedir perdão?', 'O que aprendi?'],
  Testemunho: ['Pedido original', 'O que aconteceu', 'Por que reconheço como resposta'],
};

type Draft = { id?: string; tipo: TipoDiario; titulo: string; texto: string; referencia: string; marcadores: string };
const vazio = (): Draft => ({ tipo: 'Reflexão livre', titulo: '', texto: '', referencia: '', marcadores: '' });

export default function Diario() {
  const db = useDB();
  const store = useStore();
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState<TipoDiario | 'Todos' | 'Favoritos'>('Todos');
  const [editor, setEditor] = useState<Draft | null>(null);

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...db.diario].sort((a, b) => b.data.localeCompare(a.data)).filter((e) =>
      (tipo === 'Todos' || (tipo === 'Favoritos' ? e.favorito : e.tipo === tipo)) &&
      (!t || [e.titulo, e.texto, e.referencia, ...e.marcadores].some((x) => x.toLowerCase().includes(t))));
  }, [db.diario, q, tipo]);

  const completo = useCompleto();
  function abrirNovo() {
    if (!completo) return;
    let d = vazio();
    try { const r = localStorage.getItem(RASCUNHO); if (r) d = { ...d, ...JSON.parse(r), id: undefined }; } catch { /* sem rascunho */ }
    setEditor(d);
  }
  // vindo da Biblioteca (“Registrar no meu diário”): abre o editor com o rascunho preparado
  useEffect(() => {
    if (location.hash.includes('novo')) { abrirNovo(); history.replaceState(null, '', location.pathname); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrir = (e: JournalEntry) => setEditor({ id: e.id, tipo: e.tipo, titulo: e.titulo, texto: e.texto, referencia: e.referencia, marcadores: e.marcadores.join(', ') });

  return (
    <>
      <PageHeader eyebrow="Diário da Sentinela" titulo="Diário">Registre o que Deus tem colocado no seu coração.</PageHeader>
      {db.diario.length > 0 && (
        <button className="-mt-3 mb-4 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line/30 px-4 text-[13px] text-accent"
          onClick={() => void compartilharOuBaixar(diarioEmTexto(lista, db.preferencias.nome), `diario-da-sentinela-${new Date().toISOString().slice(0, 10)}.txt`)}>
          <Share2 size={14} /> Exportar {lista.length === db.diario.length ? 'diário' : `${lista.length} registro${lista.length === 1 ? '' : 's'} filtrado${lista.length === 1 ? '' : 's'}`}
        </button>
      )}

      {!completo && <div className="mb-4"><AvisoCompleto recurso="diario" compacto /></div>}
      <div className="relative mb-3">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input type="search" aria-label="Pesquisar no diário" placeholder="Pesquisar" className="field !pl-11" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Filtrar por tipo">
        {(['Todos', 'Favoritos', ...TIPOS_DIARIO] as const).map((t) => (
          <button key={t} onClick={() => setTipo(t)} aria-pressed={tipo === t}
            className={clsx('min-h-9 shrink-0 rounded-full border px-3 text-[13px]', tipo === t ? 'border-ouro bg-ouro text-noite' : 'border-line/30 text-muted')}>{t}</button>
        ))}
      </div>

      {lista.length === 0 ? (
        <EmptyState icone={<NotebookPen size={34} strokeWidth={1.3} />} titulo={db.diario.length ? 'Nada encontrado' : 'Seu diário está em branco'}
          texto={db.diario.length ? 'Tente outra palavra ou filtro.' : 'Comece com uma palavra, uma oração ou um fechamento do dia.'}
          acao={!db.diario.length && completo && <button className="btn-primary" onClick={abrirNovo}><Plus size={18} /> Novo registro</button>} />
      ) : (
        <ul className="space-y-2.5">
          {lista.map((e) => (
            <li key={e.id} className="card flex items-start gap-3 p-4">
              <button className="min-w-0 flex-1 text-left" onClick={() => abrir(e)}>
                <p className="text-[12px] text-accent">{e.tipo} · {dataCurta(e.data)}</p>
                <p className="mt-0.5 font-serif text-[16px]">{e.titulo}</p>
                {e.texto && <p className="mt-1 line-clamp-2 font-serif text-[14px] text-muted">{e.texto}</p>}
              </button>
              <button onClick={() => store.favoritar(e.id)} aria-pressed={e.favorito} aria-label={e.favorito ? 'Remover dos favoritos' : 'Favoritar'} className="grid h-10 w-10 place-items-center">
                <Star size={18} className={e.favorito ? 'fill-ouro text-ouro' : 'text-muted'} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {db.diario.length > 0 && completo && (
        <button className="btn-primary fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2" onClick={abrirNovo}><Plus size={18} /> Novo registro</button>
      )}

      <Sheet open={!!editor} onClose={() => setEditor(null)} titulo={editor?.id ? 'Editar registro' : 'Novo registro'}>
        {editor && <JournalEditor inicial={editor} onDone={() => setEditor(null)} />}
      </Sheet>
    </>
  );
}

function JournalEditor({ inicial, onDone }: { inicial: Draft; onDone: () => void }) {
  const store = useStore();
  const auth = useAuth();
  const db = useDB();
  const [d, setD] = useState<Draft>(inicial);
  const [erro, setErro] = useState<string>();
  const [excluir, setExcluir] = useState(false);

  // rascunho salvo automaticamente (apenas para novos registros, neste aparelho)
  useEffect(() => {
    if (d.id) return;
    const t = setTimeout(() => { try { localStorage.setItem(RASCUNHO, JSON.stringify(d)); } catch { /* noop */ } }, 500);
    return () => clearTimeout(t);
  }, [d]);

  const modelo = MODELOS[d.tipo];
  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!d.titulo.trim()) return setErro('Dê um título ao registro');
    store.salvarRegistro({
      id: d.id, tipo: d.tipo, titulo: d.titulo.trim(), texto: d.texto, referencia: d.referencia.trim(),
      marcadores: d.marcadores.split(',').map((m) => m.trim()).filter(Boolean).slice(0, 12),
      estacao: db.estacoes.find((x) => !x.fim)?.estacao,
    });
    if (!d.id) { try { localStorage.removeItem(RASCUNHO); } catch { /* noop */ } }
    onDone();
  }

  return (
    <form className="space-y-4" onSubmit={salvar}>
      <Field label="Tipo" htmlFor="tp"><select id="tp" className="field" value={d.tipo} onChange={(e) => setD({ ...d, tipo: e.target.value as TipoDiario })}>{TIPOS_DIARIO.map((t) => <option key={t}>{t}</option>)}</select></Field>
      <Field label="Título" htmlFor="ti" erro={erro}><input id="ti" className="field" maxLength={140} value={d.titulo} onChange={(e) => { setD({ ...d, titulo: e.target.value }); setErro(undefined); }} /></Field>
      {modelo && !d.texto && (
        <button type="button" className="btn-ghost w-full text-[13px]" onClick={() => setD({ ...d, texto: modelo.map((p, i) => `${i + 1}. ${p}\n\n`).join('') })}>Usar modelo de escrita orientada</button>
      )}
      <Field label="Texto" htmlFor="tx"><textarea id="tx" rows={9} className="field font-serif leading-relaxed" value={d.texto} onChange={(e) => setD({ ...d, texto: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Referência bíblica" htmlFor="rf"><input id="rf" className="field" placeholder="Ex.: Salmos 23" value={d.referencia} onChange={(e) => setD({ ...d, referencia: e.target.value })} /></Field>
        <Field label="Marcadores" htmlFor="mk"><input id="mk" className="field" placeholder="separe por vírgula" value={d.marcadores} onChange={(e) => setD({ ...d, marcadores: e.target.value })} /></Field>
      </div>
      {!d.id && <p className="text-[12px] text-muted">Rascunho salvo automaticamente neste aparelho.{auth.session ? ' Depois de salvar, abra o registro para anexar fotos e áudios.' : ''}</p>}
      {d.id && <div className="rounded-xl border border-line/20 p-3"><JournalAttachments entryId={d.id} /></div>}
      <button className="btn-primary w-full" type="submit">Salvar registro</button>
      {d.id && <>
        <button type="button" className="min-h-11 w-full text-sm text-[#E79A8F]" onClick={() => setExcluir(true)}>Excluir registro</button>
        <ConfirmationDialog open={excluir} onClose={() => setExcluir(false)} perigo titulo="Excluir registro?" confirmar="Excluir"
          texto={auth.session ? 'Este registro e seus anexos serão apagados da sua conta.' : 'Este registro será apagado deste aparelho.'}
          onConfirm={() => {
            const sb = getSupabase(); const u = auth.session?.user.id;
            if (sb && u) void removerDoRegistro(sb, u, d.id!).catch(() => undefined);
            store.excluirRegistro(d.id!); onDone();
          }} />
      </>}
    </form>
  );
}
