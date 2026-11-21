import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Sem as variáveis, o app funciona em modo local (somente neste aparelho). */
export const supabaseConfigurado = Boolean(url && key);

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigurado) return null;
  client ??= createClient(url!, key!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' /* links de e-mail funcionam em qualquer navegador (ex.: abertos pelo app do Gmail) */ },
  });
  return client;
}
