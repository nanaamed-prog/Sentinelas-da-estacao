import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { LIMITE_DIARIO, SISTEMA } from '@/lib/assistant/sistema';

export const dynamic = 'force-dynamic';

const corpo = z.object({
  mensagem: z.string().trim().min(1).max(2000),
  conversaId: z.string().uuid().optional(),
  contexto: z.object({
    estacao: z.string().max(40).optional(),
    portal: z.string().max(60).optional(),
    pedido: z.string().max(400).optional(),
    objetivo: z.string().max(400).optional(),
  }).optional(),
});

const json = (d: unknown, status = 200) => Response.json(d, { status, headers: { 'Cache-Control': 'no-store' } });
const configurada = () => Boolean(process.env.AI_API_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** A IA avançada está ativada no servidor? (não revela nada além disso) */
export function GET() {
  return json({ disponivel: configurada(), limiteDiario: LIMITE_DIARIO });
}

export async function POST(req: Request) {
  if (!configurada()) return json({ erro: 'A IA avançada não está ativada.' }, 503);
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ erro: 'Entre na sua conta.' }, 401);

  // cliente com o token da usuária: todas as leituras e gravações passam pelo RLS
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false },
  });
  const { data: u, error: eu } = await sb.auth.getUser(token);
  if (eu || !u.user) return json({ erro: 'Sessão expirada. Entre novamente.' }, 401);
  const uid = u.user.id;

  let dados: z.infer<typeof corpo>;
  try { dados = corpo.parse(await req.json()); } catch { return json({ erro: 'Mensagem inválida.' }, 400); }

  // consentimento expresso para enviar textos a serviço externo de IA
  const { data: cons } = await sb.from('consent_records').select('concedido').eq('tipo', 'ia_envio_textos').order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!cons?.concedido) return json({ erro: 'É preciso autorizar o uso da IA nas configurações da assistente.' }, 403);

  // limite de uso diário
  const desde = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await sb.from('ai_messages').select('id', { count: 'exact', head: true }).eq('papel', 'user').gte('created_at', desde);
  if ((count ?? 0) >= LIMITE_DIARIO) return json({ erro: `Limite de ${LIMITE_DIARIO} mensagens por dia atingido. Volte amanhã.` }, 429);

  // conversa
  let conversaId = dados.conversaId;
  if (conversaId) {
    const { data: c } = await sb.from('ai_conversations').select('id').eq('id', conversaId).maybeSingle();
    if (!c) conversaId = undefined;
  }
  if (!conversaId) {
    const { data: c, error } = await sb.from('ai_conversations').insert({ user_id: uid, titulo: dados.mensagem.slice(0, 60), contexto: dados.contexto ?? {} }).select('id').single();
    if (error) return json({ erro: 'Não foi possível iniciar a conversa.' }, 500);
    conversaId = c.id;
  }
  const { data: hist } = await sb.from('ai_messages').select('papel, conteudo').eq('conversation_id', conversaId).order('created_at', { ascending: false }).limit(12);
  const anteriores = (hist ?? []).reverse().map((m) => ({ role: m.papel === 'user' ? 'user' : 'assistant', content: m.conteudo }));

  const ctx = dados.contexto;
  const contexto = ctx && Object.values(ctx).some(Boolean)
    ? `\n\nContexto autorizado pela usuária:${ctx.estacao ? `\n- Estação: ${ctx.estacao}` : ''}${ctx.portal ? `\n- Portal: ${ctx.portal}` : ''}${ctx.pedido ? `\n- Pedido: ${ctx.pedido}` : ''}${ctx.objetivo ? `\n- Objetivo: ${ctx.objetivo}` : ''}`
    : '';

  let resposta = '';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.AI_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'claude-haiku-5-5',
        max_tokens: 700,
        system: SISTEMA + contexto,
        messages: [...anteriores, { role: 'user', content: dados.mensagem }],
      }),
    });
    if (!r.ok) { console.error('assistente: falha no provedor', r.status); return json({ erro: 'A assistente está indisponível agora.' }, 502); }
    const out = await r.json();
    resposta = (out.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n').trim();
  } catch {
    console.error('assistente: erro de rede'); // sem registrar textos pessoais
    return json({ erro: 'A assistente está indisponível agora.' }, 502);
  }

  await sb.from('ai_messages').insert([
    { user_id: uid, conversation_id: conversaId, papel: 'user', conteudo: dados.mensagem },
    { user_id: uid, conversation_id: conversaId, papel: 'assistant', conteudo: resposta.slice(0, 20000) },
  ]);
  return json({ resposta, conversaId, restantes: Math.max(0, LIMITE_DIARIO - (count ?? 0) - 1) });
}
