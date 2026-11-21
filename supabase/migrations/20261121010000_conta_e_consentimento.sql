-- Consentimento registrado no cadastro e exclusão da própria conta (sem chave de serviço no app)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v text := new.raw_user_meta_data->>'aceite_privacidade';
begin
  insert into public.profiles (id, nome) values (new.id, left(coalesce(new.raw_user_meta_data->>'nome', ''), 60));
  insert into public.user_preferences (user_id) values (new.id);
  if v is not null then
    insert into public.consent_records (user_id, tipo, concedido, versao)
    values (new.id, 'termos', true, left(v, 20)), (new.id, 'privacidade', true, left(v, 20));
  end if;
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- A usuária só consegue apagar a PRÓPRIA conta; todos os dados pessoais caem em cascata.
create or replace function public.excluir_minha_conta()
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'não autenticada'; end if;
  delete from auth.users where id = me;
end; $$;
revoke execute on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
