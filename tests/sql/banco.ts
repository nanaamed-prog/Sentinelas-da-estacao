/** Banco Postgres em memória (PGlite) com um mínimo do Supabase (auth, storage, papéis) para testar as migrações. */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const PRELUDIO = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema storage;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
alter table storage.objects enable row level security;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
`;

export async function novoBanco() {
  const db = new PGlite();
  await db.exec(PRELUDIO);
  const dir = path.join(__dirname, '..', '..', 'supabase', 'migrations');
  for (const f of readdirSync(dir).sort()) await db.exec(readFileSync(path.join(dir, f), 'utf8'));
  await db.exec(`grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
    grant select on all tables in schema public to anon; grant select, insert, delete on storage.objects to authenticated;`);
  return db;
}

/** Executa como uma usuária (papel authenticated + auth.uid()). */
export async function como<T>(db: PGlite, uid: string | null, sql: string, params: unknown[] = []) {
  await db.exec(`set role ${uid ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false);`);
  try { return await db.query<T>(sql, params); } finally { await db.exec('reset role;'); }
}
