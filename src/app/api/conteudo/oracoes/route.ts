import { json, verificarAcesso } from '@/lib/assinatura/servidor';
import { DADOS_ORACOES } from '@/lib/conteudo-pago/oracoes';

export const dynamic = 'force-dynamic';

/** Textos das orações de batalha espiritual — plano completo (verificado no servidor). */
export async function GET(req: Request) {
  let a;
  try { a = await verificarAcesso(req); } catch { return json({ erro: 'Não foi possível verificar o acesso agora.' }, 503); }
  if (!a.completo) return json({ erro: 'Recurso do Sentinelas Completo.', recurso: 'oracoes' }, 403);
  return json({ ...DADOS_ORACOES, completo: true });
}
