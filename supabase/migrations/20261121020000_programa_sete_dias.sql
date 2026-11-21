-- Programa da jornada (conteúdo dos dias fica no app; aqui só o registro do programa)
insert into public.journey_programs (id, titulo, publicado)
values ('sete-dias', 'Plano de Sete Dias', true)
on conflict (id) do update set titulo = excluded.titulo, publicado = true;
