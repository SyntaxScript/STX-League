insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'team-logos',
    'team-logos',
    true,                                      
    5242880,                                   
    array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']::text[]
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "team_logos_public_read" on storage.objects;
create policy "team_logos_public_read" on storage.objects
    for select to public
    using (bucket_id = 'team-logos');

drop policy if exists "team_logos_user_upload" on storage.objects;
create policy "team_logos_user_upload" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'team-logos'
        and (storage.foldername(name))[1] = public.current_discord_id()
    );

drop policy if exists "team_logos_user_update" on storage.objects;
create policy "team_logos_user_update" on storage.objects
    for update to authenticated
    using (
        bucket_id = 'team-logos'
        and (storage.foldername(name))[1] = public.current_discord_id()
    );

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
