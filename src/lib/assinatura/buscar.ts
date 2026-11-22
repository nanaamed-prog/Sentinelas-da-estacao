/**
 * Chamadas do navegador às rotas do servidor. (Na prévia estática, este módulo é trocado por um simulado.)
 * O token da sessão vai no cabeçalho; nenhuma chave secreta passa por aqui.
 */
export async function chamar<T>(caminho: string, token: string | null, init?: { metodo?: 'GET' | 'POST'; corpo?: unknown }): Promise<{ ok: boolean; status: number; dados: T }> {
  const r = await fetch(caminho, {
    method: init?.metodo ?? 'GET',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.corpo ? { 'Content-Type': 'application/json' } : {}) },
    body: init?.corpo ? JSON.stringify(init.corpo) : undefined,
    cache: 'no-store',
  });
  const dados = (await r.json().catch(() => ({}))) as T;
  return { ok: r.ok, status: r.status, dados };
}

/** Somente na prévia (o módulo simulado define esta função). */
export const previaEncerrar: undefined | (() => void) = undefined;
