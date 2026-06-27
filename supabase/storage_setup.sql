-- =============================================================================
-- Storage bucket для логотипов команд
-- Запустить в Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- ─── Создаём публичный bucket ──────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'team-logos',
    'team-logos',
    true,                                      -- публичный (любой может ЧИТАТЬ по URL)
    5242880,                                   -- 5 MB
    array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']::text[]
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ─── RLS-политики для storage.objects ──────────────────────────────────────

-- READ: любой может смотреть логотипы по URL (bucket публичный)
drop policy if exists "team_logos_public_read" on storage.objects;
create policy "team_logos_public_read" on storage.objects
    for select to public
    using (bucket_id = 'team-logos');

-- INSERT: залогиненный пользователь может загружать
--   ОГРАНИЧЕНИЕ: путь файла должен начинаться с его Discord ID
--   Это нужно чтобы один юзер не мог перезаписать чужое лого
drop policy if exists "team_logos_user_upload" on storage.objects;
create policy "team_logos_user_upload" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'team-logos'
        and (storage.foldername(name))[1] = public.current_discord_id()
    );

-- UPDATE: пользователь может обновлять только свои файлы
drop policy if exists "team_logos_user_update" on storage.objects;
create policy "team_logos_user_update" on storage.objects
    for update to authenticated
    using (
        bucket_id = 'team-logos'
        and (storage.foldername(name))[1] = public.current_discord_id()
    );

-- DELETE: владелец может удалить + админы могут удалить любой
drop policy if exists "team_logos_delete" on storage.objects;
create policy "team_logos_delete" on storage.objects
    for delete to authenticated
    using (
        bucket_id = 'team-logos'
        and (
            (storage.foldername(name))[1] = public.current_discord_id()
            or public.is_admin()
        )
    );

-- =============================================================================
-- ГОТОВО! После применения капитаны смогут грузить лого, админы видеть их.
-- =============================================================================
