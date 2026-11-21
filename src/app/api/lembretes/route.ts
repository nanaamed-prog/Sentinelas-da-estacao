import { decodificar, gerarIcs } from '@/lib/reminders/ics';

/** Gera o arquivo de calendário dos portais escolhidos. Não recebe nem guarda dados pessoais. */
export function GET(req: Request) {
  const url = new URL(req.url);
  const lembretes = decodificar(url.searchParams.get('p'));
  if (!lembretes.length) return new Response('Nenhum portal informado.', { status: 400 });
  return new Response(gerarIcs(lembretes, url.origin), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="sentinelas-portais.ics"',
      'Cache-Control': 'no-store',
    },
  });
}
