import type { SupabaseClient } from '@supabase/supabase-js';
import { uid } from '@/lib/utils/format';

/** Anexos privados do diário: Supabase Storage (bucket privado) + tabela journal_attachments, ambos protegidos por RLS. */
export const BUCKET = 'anexos-diario';
export const LIMITE_BYTES = 10 * 1024 * 1024;
export const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/webm'];

export interface Anexo { id: string; entryId: string; caminho: string; mime: string; tamanho: number; criadoEm: string; url?: string }

const extensao = (mime: string) => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/webm': 'webm' }[mime] ?? 'bin');

/** Normaliza o tipo (ex.: "audio/webm;codecs=opus" → "audio/webm"; HEIC é convertido antes, via canvas). */
export const tipoBase = (mime: string) => mime.split(';')[0].trim().toLowerCase();

/** Reduz fotos grandes para economizar espaço (máx. 1600 px, JPEG). */
export async function prepararImagem(arquivo: File): Promise<Blob> {
  if (!arquivo.type.startsWith('image/')) return arquivo;
  try {
    const bmp = await createImageBitmap(arquivo);
    const escala = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * escala); c.height = Math.round(bmp.height * escala);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error('falha ao converter'))), 'image/jpeg', 0.85));
  } catch {
    return arquivo; // navegador sem suporte: envia o original
  }
}

export function validar(blob: Blob): string | null {
  if (!TIPOS.includes(tipoBase(blob.type))) return 'Tipo de arquivo não aceito. Use foto, PDF ou áudio.';
  if (blob.size > LIMITE_BYTES) return 'Arquivo maior que 10 MB.';
  if (blob.size === 0) return 'Arquivo vazio.';
  return null;
}

export async function listar(sb: SupabaseClient, entryId: string): Promise<Anexo[]> {
  const { data, error } = await sb.from('journal_attachments').select('*').eq('entry_id', entryId).order('created_at');
  if (error) throw new Error(error.message);
  const lista: Anexo[] = (data ?? []).map((r) => ({ id: r.id, entryId: r.entry_id, caminho: r.storage_path, mime: r.mime, tamanho: r.tamanho, criadoEm: r.created_at }));
  if (lista.length) {
    // endereços temporários (1 hora): os arquivos nunca ficam públicos
    const { data: urls } = await sb.storage.from(BUCKET).createSignedUrls(lista.map((a) => a.caminho), 3600);
    urls?.forEach((u, i) => { lista[i].url = u.signedUrl ?? undefined; });
  }
  return lista;
}

export async function enviar(sb: SupabaseClient, userId: string, entryId: string, blob: Blob): Promise<void> {
  const mime = tipoBase(blob.type);
  const erro = validar(blob);
  if (erro) throw new Error(erro);
  const caminho = `${userId}/${entryId}/${uid()}.${extensao(mime)}`;
  const up = await sb.storage.from(BUCKET).upload(caminho, blob, { contentType: mime, upsert: false });
  if (up.error) throw new Error(up.error.message);
  const ins = await sb.from('journal_attachments').insert({ user_id: userId, entry_id: entryId, storage_path: caminho, mime, tamanho: blob.size });
  if (ins.error) { await sb.storage.from(BUCKET).remove([caminho]); throw new Error(ins.error.message); }
}

export async function remover(sb: SupabaseClient, a: Pick<Anexo, 'id' | 'caminho'>): Promise<void> {
  await sb.storage.from(BUCKET).remove([a.caminho]);
  const { error } = await sb.from('journal_attachments').delete().eq('id', a.id);
  if (error) throw new Error(error.message);
}

/** Apaga os arquivos de um registro (as linhas da tabela caem em cascata com o registro). */
export async function removerDoRegistro(sb: SupabaseClient, userId: string, entryId: string): Promise<void> {
  const { data } = await sb.storage.from(BUCKET).list(`${userId}/${entryId}`);
  if (data?.length) await sb.storage.from(BUCKET).remove(data.map((f) => `${userId}/${entryId}/${f.name}`));
}

/** Apaga todos os arquivos da usuária (antes de excluir a conta). */
export async function removerTudo(sb: SupabaseClient, userId: string): Promise<void> {
  const { data: pastas } = await sb.storage.from(BUCKET).list(userId, { limit: 1000 });
  for (const p of pastas ?? []) await removerDoRegistro(sb, userId, p.name);
}
