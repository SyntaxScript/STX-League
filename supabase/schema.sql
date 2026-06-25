-- =============================================================================
-- STX League MD — Supabase database schema
-- =============================================================================
-- Запустить эту миграцию в Supabase Dashboard → SQL Editor → New query → Run
--
-- Что создаём:
--   • teams       — заявки команд
--   • players     — игроки команд (5 основных + 1 запасной)
--   • admins      — список Discord ID администраторов
--   • audit_log   — журнал админ-действий
--   • RLS-политики — серверная защита: кто что может читать/писать
--
-- Безопасность:
--   • Анонимы могут только READ approved-команды (для публичной страницы /teams)
--   • Залогиненный через Discord — может создать СВОЮ заявку (1 заявка / Discord ID)
--   • Только админ может одобрять/отклонять/удалять
--   • Никто кроме сервиса не может писать в audit_log
-- =============================================================================

-- ─── Расширения ─────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- =============================================================================
-- ТАБЛИЦА: admins (список Discord ID администраторов)
-- =============================================================================
create table if not exists public.admins (
    id                bigserial primary key,
    discord_id        text unique not null,
    discord_username  text,
    note              text,
    created_at        timestamptz default now()
);

comment on table public.admins is 'Список Discord ID администраторов турнира';

-- =============================================================================
-- ТАБЛИЦА: teams (заявки команд)
-- =============================================================================
create table if not exists public.teams (
    id                  uuid primary key default uuid_generate_v4(),
    team_name           text not null check (char_length(team_name) between 2 and 50),
    team_tag            text check (team_tag is null or char_length(team_tag) between 2 and 5),
    logo_url            text,
    captain_contact     text not null check (char_length(captain_contact) between 3 and 100),
    captain_discord_id  text not null,
    captain_username    text,

    status              text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected')),
    rejection_reason    text,

    submitted_at        timestamptz default now(),
    reviewed_at         timestamptz,
    reviewed_by         text,

    -- Один Discord-аккаунт = одна заявка (защита от спама)
    constraint one_team_per_captain unique (captain_discord_id)
);

create index if not exists idx_teams_status on public.teams(status);
create index if not exists idx_teams_captain on public.teams(captain_discord_id);

comment on table public.teams is 'Заявки команд на участие в турнире';

-- =============================================================================
-- ТАБЛИЦА: players (5 основных + опционально 1 запасной)
-- =============================================================================
create table if not exists public.players (
    id          uuid primary key default uuid_generate_v4(),
    team_id     uuid not null references public.teams(id) on delete cascade,
    position    int not null check (position between 1 and 6),
    nickname    text not null check (char_length(nickname) between 2 and 30),
    steam       text not null check (char_length(steam) between 3 and 100),
    is_sub      boolean not null default false,

    constraint unique_position_per_team unique (team_id, position)
);

create index if not exists idx_players_team on public.players(team_id);

comment on table public.players is 'Игроки команд (5 основных + опц. запасной)';

-- =============================================================================
-- ТАБЛИЦА: audit_log (журнал админ-действий)
-- =============================================================================
create table if not exists public.audit_log (
    id              bigserial primary key,
    admin_discord_id text not null,
    action          text not null,    -- 'approve', 'reject', 'delete', 'login'
    target_team_id  uuid,
    details         jsonb,
    created_at      timestamptz default now()
);

create index if not exists idx_audit_admin on public.audit_log(admin_discord_id);
create index if not exists idx_audit_created on public.audit_log(created_at desc);

comment on table public.audit_log is 'Журнал админ-действий (для аудита и безопасности)';

-- =============================================================================
-- HELPER: получить Discord ID текущего пользователя из JWT
-- =============================================================================
create or replace function public.current_discord_id()
returns text
language sql
stable
as $$
    select coalesce(
        auth.jwt() -> 'user_metadata' ->> 'provider_id',
        auth.jwt() -> 'user_metadata' ->> 'sub'
    );
$$;

-- =============================================================================
-- HELPER: текущий пользователь — админ?
-- =============================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
    select exists (
        select 1 from public.admins
        where discord_id = public.current_discord_id()
    );
$$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) — главная защита
-- =============================================================================
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.admins enable row level security;
alter table public.audit_log enable row level security;

-- ─── teams: READ ────────────────────────────────────────────────────────────
-- Любой (даже без логина) может видеть только APPROVED-команды
drop policy if exists "teams_select_approved_public" on public.teams;
create policy "teams_select_approved_public" on public.teams
    for select
    to anon, authenticated
    using (status = 'approved');

-- Капитан видит свою заявку в любом статусе
drop policy if exists "teams_select_own" on public.teams;
create policy "teams_select_own" on public.teams
    for select
    to authenticated
    using (captain_discord_id = public.current_discord_id());

-- Админ видит всё
drop policy if exists "teams_select_admin" on public.teams;
create policy "teams_select_admin" on public.teams
    for select
    to authenticated
    using (public.is_admin());

-- ─── teams: INSERT ──────────────────────────────────────────────────────────
-- Залогиненный пользователь может создать ТОЛЬКО свою заявку (со своим Discord ID)
drop policy if exists "teams_insert_own" on public.teams;
create policy "teams_insert_own" on public.teams
    for insert
    to authenticated
    with check (
        captain_discord_id = public.current_discord_id()
        and status = 'pending'  -- нельзя сразу создать approved!
    );

-- ─── teams: UPDATE ──────────────────────────────────────────────────────────
-- Только админ может менять статус
drop policy if exists "teams_update_admin" on public.teams;
create policy "teams_update_admin" on public.teams
    for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- ─── teams: DELETE ──────────────────────────────────────────────────────────
drop policy if exists "teams_delete_admin" on public.teams;
create policy "teams_delete_admin" on public.teams
    for delete
    to authenticated
    using (public.is_admin());

-- ─── players: READ ──────────────────────────────────────────────────────────
-- Игроки видны вместе с командой
drop policy if exists "players_select_approved" on public.players;
create policy "players_select_approved" on public.players
    for select
    to anon, authenticated
    using (exists (
        select 1 from public.teams t
        where t.id = players.team_id and t.status = 'approved'
    ));

drop policy if exists "players_select_own" on public.players;
create policy "players_select_own" on public.players
    for select
    to authenticated
    using (exists (
        select 1 from public.teams t
        where t.id = players.team_id
        and t.captain_discord_id = public.current_discord_id()
    ));

drop policy if exists "players_select_admin" on public.players;
create policy "players_select_admin" on public.players
    for select
    to authenticated
    using (public.is_admin());

-- ─── players: INSERT ────────────────────────────────────────────────────────
-- Только капитан команды может добавить игроков в СВОЮ заявку
drop policy if exists "players_insert_own_team" on public.players;
create policy "players_insert_own_team" on public.players
    for insert
    to authenticated
    with check (exists (
        select 1 from public.teams t
        where t.id = players.team_id
        and t.captain_discord_id = public.current_discord_id()
    ));

-- ─── players: DELETE ────────────────────────────────────────────────────────
drop policy if exists "players_delete_admin" on public.players;
create policy "players_delete_admin" on public.players
    for delete
    to authenticated
    using (public.is_admin());

-- ─── admins: READ ───────────────────────────────────────────────────────────
-- Список админов виден только админам
drop policy if exists "admins_select_admin" on public.admins;
create policy "admins_select_admin" on public.admins
    for select
    to authenticated
    using (public.is_admin());

-- Никто (кроме service_role) не может писать в admins через API!
-- Управление списком админов — только через Supabase Dashboard.

-- ─── audit_log: только READ для админов ─────────────────────────────────────
drop policy if exists "audit_select_admin" on public.audit_log;
create policy "audit_select_admin" on public.audit_log
    for select
    to authenticated
    using (public.is_admin());

-- INSERT в audit_log делается ТОЛЬКО через триггер ниже, не через API

-- =============================================================================
-- ТРИГГЕР: автоматическая запись в audit_log при изменении заявки
-- =============================================================================
create or replace function public.log_team_change()
returns trigger
language plpgsql
security definer
as $$
begin
    if tg_op = 'UPDATE' and (old.status is distinct from new.status) then
        insert into public.audit_log (admin_discord_id, action, target_team_id, details)
        values (
            public.current_discord_id(),
            new.status,
            new.id,
            jsonb_build_object('old_status', old.status, 'new_status', new.status, 'team_name', new.team_name)
        );
        new.reviewed_at := now();
        new.reviewed_by := public.current_discord_id();
    elsif tg_op = 'DELETE' then
        insert into public.audit_log (admin_discord_id, action, target_team_id, details)
        values (
            public.current_discord_id(),
            'delete',
            old.id,
            jsonb_build_object('team_name', old.team_name, 'captain', old.captain_discord_id)
        );
        return old;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_log_team_change on public.teams;
create trigger trg_log_team_change
    before update or delete on public.teams
    for each row execute function public.log_team_change();

-- =============================================================================
-- ВЬЮХА: команды с игроками (для удобного фронта)
-- =============================================================================
create or replace view public.teams_with_players as
select
    t.id,
    t.team_name,
    t.team_tag,
    t.logo_url,
    t.captain_contact,
    t.captain_username,
    t.status,
    t.submitted_at,
    coalesce(
        json_agg(
            json_build_object(
                'position', p.position,
                'nickname', p.nickname,
                'steam', p.steam,
                'is_sub', p.is_sub
            ) order by p.position
        ) filter (where p.id is not null),
        '[]'::json
    ) as players
from public.teams t
left join public.players p on p.team_id = t.id
group by t.id;

-- =============================================================================
-- ОГРАНИЧЕНИЕ: максимум 16 одобренных команд
-- =============================================================================
create or replace function public.check_max_approved_teams()
returns trigger
language plpgsql
as $$
declare
    approved_count int;
begin
    if new.status = 'approved' and (old.status is null or old.status != 'approved') then
        select count(*) into approved_count from public.teams where status = 'approved';
        if approved_count >= 16 then
            raise exception 'Достигнут лимит в 16 одобренных команд';
        end if;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_max_approved on public.teams;
create trigger trg_max_approved
    before insert or update on public.teams
    for each row execute function public.check_max_approved_teams();

-- =============================================================================
-- ГОТОВО! Следующий шаг: добавить себя в admins (см. 03_ADD_ADMIN.md)
-- =============================================================================
