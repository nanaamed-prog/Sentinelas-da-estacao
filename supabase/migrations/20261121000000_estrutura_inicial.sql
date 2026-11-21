-- Sentinelas da Estação — estrutura inicial (Fase 2)
-- Conteúdo público separado de dados pessoais. Toda tabela pessoal tem user_id, timestamps e RLS.

-- ============ Funções utilitárias ============
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ CONTEÚDO PÚBLICO ============
create table public.spiritual_seasons (
  id text primary key check (id in ('primavera','verao','outono','inverno')),
  nome text not null,
  chamado text not null,
  temas text[] not null default '{}',
  periodo_inicio text not null,   -- dd/mm
  periodo_fim text not null,
  ordem smallint not null
);

create table public.prayer_portals (
  id text primary key,
  hora smallint not null unique check (hora between 0 and 23),
  nome text not null,
  artigo text not null check (artigo in ('da','do')),
  proposito text not null,
  explicacao text,
  referencias text[] not null default '{}',
  oracao_orientativa text
);

create table public.devotional_content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  categoria text not null,
  corpo text not null default '',
  ordem int not null default 0,
  publicado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.journey_programs (
  id text primary key,
  titulo text not null,
  dias jsonb not null default '[]',
  publicado boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ DADOS PESSOAIS ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '' check (char_length(nome) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tema text not null default 'noite' check (tema in ('noite','pergaminho')),
  onboarding_concluido boolean not null default false,
  lembretes boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_portal_settings (
  user_id uuid not null references auth.users(id) on delete cascade,
  portal_id text not null references public.prayer_portals(id),
  ativo boolean not null default true,
  lembrete boolean not null default false,
  horario_lembrete time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, portal_id)
);

create table public.season_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  estacao text not null references public.spiritual_seasons(id),
  inicio timestamptz not null default now(),
  fim timestamptz,
  motivos text not null default '' check (char_length(motivos) <= 4000),
  reflexao text not null default '' check (char_length(reflexao) <= 8000),
  desafios text not null default '' check (char_length(desafios) <= 4000),
  atitudes text not null default '' check (char_length(atitudes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- apenas uma estação aberta por usuária
create unique index season_history_uma_aberta on public.season_history (user_id) where fim is null;

create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null check (char_length(trim(titulo)) between 1 and 120),
  descricao text not null default '' check (char_length(descricao) <= 4000),
  categoria text not null default 'Outros' check (categoria in ('Família','Filhos','Casamento e relacionamentos','Saúde','Trabalho','Finanças','Igreja','Vida espiritual','Outros')),
  pessoa_ou_assunto text not null default '' check (char_length(pessoa_ou_assunto) <= 120),
  portal_id text references public.prayer_portals(id),
  estacao text references public.spiritual_seasons(id),
  prioritario boolean not null default false,
  status text not null default 'Em oração' check (status in ('Em oração','Em acompanhamento','Respondido','Encerrado')),
  respondido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.prayer_request_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  tipo text not null check (tipo in ('criado','status','recalibrado','nota')),
  o_que_mudou text check (char_length(o_que_mudou) <= 4000),
  o_que_permanece text check (char_length(o_que_permanece) <= 4000),
  nova_necessidade text check (char_length(nova_necessidade) <= 4000),
  atitude text check (char_length(atitude) <= 4000),
  status text,
  created_at timestamptz not null default now(),
  -- garante que a atualização pertence a um pedido da MESMA usuária
  foreign key (request_id, user_id) references public.prayer_requests(id, user_id) on delete cascade
);

create table public.testimonies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid,
  titulo text not null default '' check (char_length(titulo) <= 140),
  texto text not null check (char_length(texto) <= 8000),
  data timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (request_id, user_id) references public.prayer_requests(id, user_id) on delete set null (request_id)
);

create table public.prayer_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  portal_id text not null references public.prayer_portals(id),
  inicio timestamptz not null default now(),
  fim timestamptz,
  oracao_pessoal text not null default '' check (char_length(oracao_pessoal) <= 8000),
  pedidos uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index prayer_sessions_uma_aberta on public.prayer_sessions (user_id) where fim is null;

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data timestamptz not null default now(),
  tipo text not null default 'Reflexão livre' check (tipo in ('Palavra','Oração','Discernimento','Gratidão','Testemunho','Reflexão livre','Fechamento do dia')),
  titulo text not null check (char_length(trim(titulo)) between 1 and 140),
  texto text not null default '' check (char_length(texto) <= 20000),
  referencia text not null default '' check (char_length(referencia) <= 80),
  estacao text references public.spiritual_seasons(id),
  portal_id text references public.prayer_portals(id),
  marcadores text[] not null default '{}' check (cardinality(marcadores) <= 12),
  favorito boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.journal_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid not null,
  storage_path text not null,
  mime text not null,
  tamanho int not null check (tamanho between 1 and 10485760),
  created_at timestamptz not null default now(),
  foreign key (entry_id, user_id) references public.journal_entries(id, user_id) on delete cascade,
  check (storage_path like user_id::text || '/%')
);

create table public.journey_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id text not null references public.journey_programs(id),
  ciclo smallint not null default 1,      -- reiniciar cria novo ciclo sem apagar o anterior
  dia smallint not null check (dia between 1 and 60),
  registro text not null default '' check (char_length(registro) <= 8000),
  concluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, program_id, ciclo, dia)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  portal_id text references public.prayer_portals(id),
  tipo text not null check (tipo in ('portal','jornada','revisao')),
  agendado_para timestamptz not null,
  enviado_em timestamptz,
  lido_em timestamptz,
  created_at timestamptz not null default now()
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null default '',
  contexto jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null,
  papel text not null check (papel in ('user','assistant')),
  conteudo text not null check (char_length(conteudo) <= 20000),
  created_at timestamptz not null default now(),
  foreign key (conversation_id, user_id) references public.ai_conversations(id, user_id) on delete cascade
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('termos','privacidade','ia_envio_textos','ia_historico')),
  concedido boolean not null,
  versao text not null,
  created_at timestamptz not null default now()
);

-- ============ Índices ============
create index on public.season_history (user_id, inicio desc);
create index on public.prayer_requests (user_id, status);
create index on public.prayer_request_updates (request_id, user_id);
create index on public.prayer_request_updates (user_id);
create index on public.testimonies (user_id);
create index on public.testimonies (request_id, user_id);
create index on public.prayer_sessions (user_id, inicio desc);
create index on public.journal_entries (user_id, data desc);
create index on public.journal_attachments (entry_id, user_id);
create index on public.journal_attachments (user_id);
create index on public.journey_progress (user_id);
create index on public.notifications (user_id, agendado_para);
create index on public.ai_conversations (user_id);
create index on public.ai_messages (conversation_id, user_id);
create index on public.ai_messages (user_id);
create index on public.consent_records (user_id, tipo, created_at desc);
create index on public.user_portal_settings (portal_id);
create index on public.season_history (estacao);
create index on public.prayer_requests (portal_id);
create index on public.prayer_requests (estacao);
create index on public.prayer_sessions (portal_id);
create index on public.journal_entries (estacao);
create index on public.journal_entries (portal_id);
create index on public.journey_progress (program_id);
create index on public.notifications (portal_id);

-- ============ updated_at automático ============
do $$
declare t text;
begin
  foreach t in array array['devotional_content','profiles','user_preferences','user_portal_settings','season_history',
    'prayer_requests','testimonies','prayer_sessions','journal_entries','journey_progress','ai_conversations']
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ============ Row Level Security ============
alter table public.spiritual_seasons enable row level security;
alter table public.prayer_portals enable row level security;
alter table public.devotional_content enable row level security;
alter table public.journey_programs enable row level security;

create policy "leitura pública" on public.spiritual_seasons for select to anon, authenticated using (true);
create policy "leitura pública" on public.prayer_portals for select to anon, authenticated using (true);
create policy "leitura pública (publicados)" on public.devotional_content for select to anon, authenticated using (publicado);
create policy "leitura pública (publicados)" on public.journey_programs for select to anon, authenticated using (publicado);

alter table public.profiles enable row level security;
create policy "própria usuária" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare t text;
begin
  foreach t in array array['user_preferences','user_portal_settings','season_history','prayer_requests','prayer_request_updates',
    'testimonies','prayer_sessions','journal_entries','journal_attachments','journey_progress','notifications',
    'ai_conversations','ai_messages','consent_records']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "própria usuária" on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- consentimentos são um registro: sem edição nem exclusão pela usuária (apenas novos registros)
drop policy "própria usuária" on public.consent_records;
create policy "ler os próprios" on public.consent_records for select to authenticated using ((select auth.uid()) = user_id);
create policy "registrar os próprios" on public.consent_records for insert to authenticated with check ((select auth.uid()) = user_id);

-- ============ Nova conta → perfil e preferências ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nome) values (new.id, left(coalesce(new.raw_user_meta_data->>'nome', ''), 60));
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Armazenamento privado (anexos do diário) ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anexos-diario', 'anexos-diario', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf','audio/mpeg','audio/mp4','audio/webm'])
on conflict (id) do nothing;

create policy "anexos: própria pasta (ler)" on storage.objects for select to authenticated
  using (bucket_id = 'anexos-diario' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "anexos: própria pasta (enviar)" on storage.objects for insert to authenticated
  with check (bucket_id = 'anexos-diario' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "anexos: própria pasta (apagar)" on storage.objects for delete to authenticated
  using (bucket_id = 'anexos-diario' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ============ Conteúdo do método ============
insert into public.spiritual_seasons (id, nome, chamado, temas, periodo_inicio, periodo_fim, ordem) values
  ('primavera','Primavera','Plante', array['Novos começos','Preparação','Obediência','Sementes','Constância','Esperança'], '21/03','20/06',1),
  ('verao','Verão','Frutifique', array['Crescimento','Serviço','Maturidade','Administração','Frutos','Responsabilidade'], '21/06','20/09',2),
  ('outono','Outono','Deixe Deus podar', array['Entrega','Renúncia','Simplificação','Revisão','Perdão','Limites'], '21/09','20/12',3),
  ('inverno','Inverno','Permaneça', array['Espera','Silêncio','Perseverança','Raízes','Descanso','Fidelidade'], '21/12','20/03',4);

insert into public.prayer_portals (id, hora, nome, artigo, proposito) values
  ('imersao',0,'Imersão','da','Render-se'),
  ('guerra',3,'Guerra','da','Interceder'),
  ('alvorada',6,'Alvorada','da','Consagrar'),
  ('colheita',9,'Colheita','da','Trabalhar'),
  ('santidade',12,'Santidade','da','Separar'),
  ('sabedoria',15,'Sabedoria','da','Discernir'),
  ('ocaso',18,'Ocaso','do','Recalibrar'),
  ('silencio',21,'Silêncio','do','Entregar');
