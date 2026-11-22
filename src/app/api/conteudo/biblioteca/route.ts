import { json, verificarAcesso } from '@/lib/assinatura/servidor';
import { CAPITULOS, LIVRO } from '@/lib/conteudo-pago/biblioteca';
import { CAPITULOS_GRATUITOS } from '@/lib/assinatura/planos';

export const dynamic = 'force-dynamic';

/** Capítulos do livro: abertura para todas; o restante só com acesso completo (verificado no servidor). */
export async function GET(req: Request) {
  let a;
  try { a = await verificarAcesso(req); } catch { return json({ erro: 'Não foi possível verificar o acesso agora.' }, 503); }
  const { capitulos: _c, ...livro } = LIVRO;
  const capitulos = a.completo ? CAPITULOS : CAPITULOS.filter((c) => CAPITULOS_GRATUITOS.includes(c.slug));
  return json({ livro, capitulos, completo: a.completo });
}
