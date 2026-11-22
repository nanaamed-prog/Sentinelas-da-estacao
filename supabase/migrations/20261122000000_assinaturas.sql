-- Assinaturas — Sentinelas da Estação
-- Planos configuráveis, assinaturas vinculadas à usuária, eventos do provedor (idempotência) e regra de acesso.
-- Enquanto app_config.assinaturas_ativas = false, TODAS as pessoas têm acesso completo (comportamento atual).
-- Nada aqui armazena dados de cartão: o pagamento acontece no checkout do provedor.

-- 1. Configuração do app (chave de lançamento) -----------------------------------------------------
create table public.app_config (
  chave text primary key,
  valor jsonb not null,
  atualizado_em timestamptz not null default now()
);
alter table public.app_config enable row level security;
create policy "leitura pública" on public.app_config for select to anon, authenticated using (true);
insert into public.app_config (chave, valor) values ('assinaturas_ativas', 'false'::jsonb);

-- 2. Planos (preços configuráveis) -------------------------------------------------------------------
create table public.planos (
  id text primary key check (id in ('mensal', 'anual')),
  nome text not null,
  periodicidade text not null check (periodicidade in ('mes', 'ano')),
  valor_centavos int not null check (valor_centavos > 0),
  moeda text not null default 'BRL',
  -- identificador do preço no provedor (ex.: price_... do Stripe). Sem ele, o checkout fica desativado.
  provedor_preco_id text,
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);
alter table public.planos enable row level security;
create policy "leitura pública" on public.planos for select to anon, authenticated using (true);
insert into public.planos (id, nome, periodicidade, valor_centavos) values
  ('mensal', 'Sentinelas Completo — mensal', 'mes', 1990),
  ('anual', 'Sentinelas Completo — anual', 'ano', 19700);

-- 3. Cliente no provedor (um por usuária) -----------------------------------------------------------
create table public.clientes_pagamento (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provedor text not null default 'stripe',
  provedor_cliente_id text unique,
  -- trava contra checkouts simultâneos
  checkout_sessao_id text,
  checkout_plano text,
  checkout_url text,
  checkout_expira_em timestamptz,
  contestacao_aberta boolean not null default false,
  atualizado_em timestamptz not null default now()
);
alter table public.clientes_pagamento enable row level security;
create policy "ler o próprio" on public.clientes_pagamento for select to authenticated using ((select auth.uid()) = user_id);

-- 4. Assinaturas -----------------------------------------------------------------------------------
create table public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provedor text not null check (provedor in ('stripe', 'cortesia')),
  provedor_assinatura_id text unique,
  plano_id text references public.planos(id),
  status text not null check (status in ('pendente', 'ativa', 'em_atraso', 'suspensa', 'pausada', 'cancelada', 'expirada')),
  periodo_inicio timestamptz,
  periodo_fim timestamptz,
  cancelar_no_fim boolean not null default false,
  cancelada_em timestamptz,
  -- instante (no provedor) do estado gravado: impede que um evento antigo sobrescreva um mais novo
  provedor_atualizado_em timestamptz,
  observacao text,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
create index assinaturas_user on public.assinaturas (user_id);
alter table public.assinaturas enable row level security;
create policy "ler as próprias" on public.assinaturas for select to authenticated using ((select auth.uid()) = user_id);
-- gravação apenas pelo servidor (chave de serviço) — nenhuma política de insert/update/delete para usuárias

-- 5. Eventos recebidos do provedor (idempotência e auditoria; sem dados pessoais) -------------------
create table public.eventos_pagamento (
  id text primary key,                -- id do evento no provedor
  provedor text not null default 'stripe',
  tipo text not null,
  criado_no_provedor timestamptz,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz,
  erro text
);
alter table public.eventos_pagamento enable row level security;  -- sem políticas: só o servidor acessa

-- 6. Regra de acesso --------------------------------------------------------------------------------
create or replace function public.assinaturas_ativas()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select (valor)::text::boolean from public.app_config where chave = 'assinaturas_ativas'), false);
$$;

-- Acesso completo: cobrança desligada, OU assinatura válida (inclui o período de novas tentativas de cobrança),
-- OU cortesia. Contestação aberta suspende o acesso enquanto é analisada.
create or replace function public.tem_acesso_completo(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when not public.assinaturas_ativas() then true
    when uid is null then false
    else exists (
      select 1 from public.assinaturas a
      where a.user_id = uid
        and a.status in ('ativa', 'em_atraso')
        and (a.periodo_fim is null or a.periodo_fim > now() - interval '1 day')
        and not coalesce((select c.contestacao_aberta from public.clientes_pagamento c where c.user_id = uid), false)
    )
  end;
$$;
revoke execute on function public.tem_acesso_completo(uuid) from public, anon, authenticated;
grant execute on function public.tem_acesso_completo(uuid) to service_role;

-- versão para a própria usuária (sem parâmetro: não permite consultar outras pessoas)
create or replace function public.acesso_completo()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.tem_acesso_completo(auth.uid());
$$;
revoke execute on function public.acesso_completo() from public;
grant execute on function public.acesso_completo() to anon, authenticated, service_role;
grant execute on function public.assinaturas_ativas() to anon, authenticated, service_role;

-- Resumo para a interface
create or replace function public.meu_acesso()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'assinaturas_ativas', public.assinaturas_ativas(),
    'completo', public.tem_acesso_completo(auth.uid())
  );
$$;
grant execute on function public.meu_acesso() to anon, authenticated;

-- 7. Recursos do plano completo: criar NOVOS registros exige acesso. -----------------------------------
-- Registros já existentes continuam legíveis, editáveis, exportáveis e apagáveis por quem os criou.
-- (upsert de um registro existente passa pela verificação do id já gravado)
create or replace function public.pode_criar(tabela text, rid uuid)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare existe boolean;
begin
  if tabela not in ('prayer_requests', 'prayer_sessions', 'journal_entries') then return false; end if;
  if public.tem_acesso_completo(auth.uid()) then return true; end if;
  execute format('select exists(select 1 from public.%I where id = $1 and user_id = $2)', tabela) into existe using rid, auth.uid();
  return existe;
end; $$;
revoke execute on function public.pode_criar(text, uuid) from public, anon;
grant execute on function public.pode_criar(text, uuid) to authenticated;

do $$
declare t text;
begin
  foreach t in array array['prayer_requests', 'prayer_sessions', 'journal_entries'] loop
    execute format('create policy "criar exige acesso completo" on public.%I as restrictive for insert to authenticated with check (public.pode_criar(%L, id))', t, t);
  end loop;
end $$;
-- anexos de registros do diário: enviar arquivo novo exige acesso
create policy "anexos: criar exige acesso completo" on public.journal_attachments as restrictive for insert to authenticated
  with check (public.acesso_completo());
create policy "anexos: enviar exige acesso completo" on storage.objects as restrictive for insert to authenticated
  with check (bucket_id <> 'anexos-diario' or public.acesso_completo());

-- 8. Excluir a conta com assinatura renovando: pedir o cancelamento antes (o provedor continuaria cobrando) ---
create or replace function public.excluir_minha_conta()
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'não autenticada'; end if;
  if exists (select 1 from public.assinaturas where user_id = me and provedor = 'stripe'
             and status in ('pendente', 'ativa', 'em_atraso') and not cancelar_no_fim) then
    raise exception 'assinatura_renovando' using hint = 'Cancele a renovação em Minha assinatura antes de excluir a conta.';
  end if;
  delete from auth.users where id = me;
end; $$;
revoke execute on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;

-- 9. Gravação atômica pelo servidor ----------------------------------------------------------------
-- Idempotência: devolve true se o evento ainda precisa ser processado (novo, ou falhou antes).
create or replace function public.registrar_evento(p_id text, p_tipo text, p_criado timestamptz)
returns boolean language plpgsql security definer set search_path = '' as $$
declare ja timestamptz;
begin
  insert into public.eventos_pagamento (id, tipo, criado_no_provedor) values (p_id, p_tipo, p_criado)
  on conflict (id) do nothing;
  select processado_em into ja from public.eventos_pagamento where id = p_id for update;
  return ja is null;
end; $$;

create or replace function public.concluir_evento(p_id text, p_erro text default null)
returns void language sql security definer set search_path = '' as $$
  update public.eventos_pagamento set processado_em = case when p_erro is null then now() end, erro = p_erro where id = p_id;
$$;

-- Grava o estado lido do provedor. Fora de ordem: um estado lido ANTES do que já está gravado é ignorado.
-- Devolve o número de assinaturas vigentes da usuária (mais de 1 indica possível duplicidade).
create or replace function public.gravar_assinatura(a jsonb)
returns int language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (a->>'user_id')::uuid; n int;
begin
  insert into public.assinaturas as s (user_id, provedor, provedor_assinatura_id, plano_id, status, periodo_inicio, periodo_fim,
    cancelar_no_fim, cancelada_em, provedor_atualizado_em, atualizada_em)
  values (v_user, 'stripe', a->>'provedor_assinatura_id', nullif(a->>'plano_id', ''), a->>'status',
    (a->>'periodo_inicio')::timestamptz, (a->>'periodo_fim')::timestamptz, coalesce((a->>'cancelar_no_fim')::boolean, false),
    (a->>'cancelada_em')::timestamptz, (a->>'lido_em')::timestamptz, now())
  on conflict (provedor_assinatura_id) do update set
    plano_id = coalesce(excluded.plano_id, s.plano_id), status = excluded.status, periodo_inicio = excluded.periodo_inicio,
    periodo_fim = excluded.periodo_fim, cancelar_no_fim = excluded.cancelar_no_fim, cancelada_em = excluded.cancelada_em,
    provedor_atualizado_em = excluded.provedor_atualizado_em, atualizada_em = now()
  where s.user_id = excluded.user_id
    and (s.provedor_atualizado_em is null or excluded.provedor_atualizado_em >= s.provedor_atualizado_em);
  select count(*) into n from public.assinaturas
   where user_id = v_user and provedor = 'stripe' and status in ('pendente', 'ativa', 'em_atraso');
  if n > 1 then
    update public.assinaturas set observacao = 'possível duplicidade — verificar no Stripe'
     where user_id = v_user and provedor = 'stripe' and status in ('pendente', 'ativa', 'em_atraso');
  end if;
  return n;
end; $$;

revoke execute on function public.registrar_evento(text, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.concluir_evento(text, text) from public, anon, authenticated;
revoke execute on function public.gravar_assinatura(jsonb) from public, anon, authenticated;
grant execute on function public.registrar_evento(text, text, timestamptz) to service_role;
grant execute on function public.concluir_evento(text, text) to service_role;
grant execute on function public.gravar_assinatura(jsonb) to service_role;

-- Cortesia (ex.: a autora, revisoras): conceder pelo SQL Editor
--   insert into public.assinaturas (user_id, provedor, status, observacao)
--   values ('<uuid da usuária>', 'cortesia', 'ativa', 'cortesia da autora');
