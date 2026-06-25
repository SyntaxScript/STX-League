-- =============================================================================
-- Добавление администраторов в таблицу admins
-- Запустить ОДИН РАЗ в Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

insert into public.admins (discord_id, discord_username, note) values
    ('488322769164173323',  'admin_1', 'Главный администратор'),
    ('1466104997786812436', 'admin_2', 'Администратор'),
    ('1334213027221868595', 'admin_3', 'Администратор')
on conflict (discord_id) do nothing;

-- Проверка:
select id, discord_id, discord_username, note, created_at from public.admins order by id;
