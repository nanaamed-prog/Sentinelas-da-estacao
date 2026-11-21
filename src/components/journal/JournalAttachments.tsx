'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Paperclip, Mic, Square, Trash2, FileText, Loader2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/provider';
import { enviar, listar, prepararImagem, remover, type Anexo } from '@/lib/attachments/anexos';

/** Fotos, PDFs e áudios privados ligados a um registro do diário. */
export function JournalAttachments({ entryId }: { entryId: string }) {
  const sb = getSupabase();
  const auth = useAuth();
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string>();
  const [gravando, setGravando] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const gravador = useRef<MediaRecorder | null>(null);
  const partes = useRef<Blob[]>([]);
  const uid = auth.session?.user.id;

  const carregar = useCallback(async () => {
    if (!sb || !uid) return;
    try { setAnexos(await listar(sb, entryId)); } catch { setErro('Não foi possível carregar os anexos.'); }
  }, [sb, uid, entryId]);
  useEffect(() => { void carregar(); }, [carregar]);

  if (!sb || !uid) {
    return <p className="text-[12px] text-muted">Anexos de foto e áudio ficam disponíveis com a sua conta.</p>;
  }

  async function subir(blob: Blob) {
    setErro(undefined); setOcupado(true);
    try {
      await auth.sincronizarAgora(); // garante que o registro já existe na conta
      await enviar(sb!, uid!, entryId, blob);
      await carregar();
    } catch (e) {
      const m = e instanceof Error ? e.message : '';
      setErro(/violates foreign key|not present/i.test(m) ? 'Salvando o registro… tente anexar de novo em instantes.' : m.startsWith('Tipo') || m.startsWith('Arquivo') ? m : 'Não foi possível enviar. Verifique a conexão.');
    } finally { setOcupado(false); }
  }

  async function aoEscolher(f?: File | null) {
    if (!f) return;
    await subir(await prepararImagem(f));
    if (input.current) input.current.value = '';
  }

  async function gravar() {
    if (gravando) { gravador.current?.stop(); return; }
    setErro(undefined);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipo = ['audio/mp4', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported?.(t)) ?? '';
      const r = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
      partes.current = [];
      r.ondataavailable = (e) => { if (e.data.size) partes.current.push(e.data); };
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setGravando(false);
        void subir(new Blob(partes.current, { type: r.mimeType || tipo || 'audio/webm' }));
      };
      gravador.current = r;
      r.start();
      setGravando(true);
    } catch {
      setErro('Não foi possível usar o microfone. Verifique a permissão do navegador.');
    }
  }

  async function apagar(a: Anexo) {
    setOcupado(true);
    try { await remover(sb!, a); setAnexos((x) => x.filter((y) => y.id !== a.id)); } catch { setErro('Não foi possível remover.'); }
    finally { setOcupado(false); }
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] font-medium text-muted">Anexos</p>
      {anexos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {anexos.map((a) => (
            <li key={a.id} className="relative overflow-hidden rounded-xl border border-line/25 bg-surface-2">
              {a.mime.startsWith('image/') && a.url && (
                <a href={a.url} target="_blank" rel="noopener"><img src={a.url} alt="Foto anexada" className="aspect-square w-full object-cover" /></a>
              )}
              {a.mime === 'application/pdf' && (
                <a href={a.url} target="_blank" rel="noopener" className="flex aspect-square flex-col items-center justify-center gap-1 text-[12px]"><FileText size={22} className="text-accent" />PDF</a>
              )}
              {a.mime.startsWith('audio/') && (
                <div className="col-span-3 flex aspect-square items-center p-1"><audio controls src={a.url} className="w-full" /></div>
              )}
              <button type="button" onClick={() => void apagar(a)} aria-label="Remover anexo"
                className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-noite-900/75 text-marfim"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <input ref={input} type="file" className="sr-only" id={`anx-${entryId}`} accept="image/*,application/pdf,audio/*" onChange={(e) => void aoEscolher(e.target.files?.[0])} />
        <label htmlFor={`anx-${entryId}`} className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border border-line/40 px-4 text-[13px]">
          <Paperclip size={14} /> Foto ou arquivo
        </label>
        {typeof window !== 'undefined' && 'MediaRecorder' in window && (
          <button type="button" onClick={() => void gravar()} disabled={ocupado && !gravando}
            className={gravando ? 'inline-flex min-h-10 items-center gap-1.5 rounded-full bg-vinho px-4 text-[13px] text-marfim' : 'inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line/40 px-4 text-[13px]'}>
            {gravando ? <><Square size={14} /> Parar gravação</> : <><Mic size={14} /> Gravar áudio</>}
          </button>
        )}
        {ocupado && !gravando && <span className="inline-flex items-center gap-1 text-[12px] text-muted"><Loader2 size={14} className="animate-spin" /> Enviando…</span>}
      </div>
      {erro && <p role="alert" className="text-[12px] text-[#E79A8F]">{erro}</p>}
      <p className="text-[11px] text-muted">Privados: só você acessa. Até 10 MB por arquivo.</p>
    </div>
  );
}
