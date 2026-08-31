-- Create the public-read, admin-managed bucket for product and certificate media.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'b2c-media',
  'b2c-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "public can read b2c media"
on storage.objects for select to public
using (bucket_id = 'b2c-media');

create policy "active admins can upload b2c media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'b2c-media'
  and (select private.is_active_admin())
);

create policy "active admins can update b2c media"
on storage.objects for update to authenticated
using (
  bucket_id = 'b2c-media'
  and (select private.is_active_admin())
)
with check (
  bucket_id = 'b2c-media'
  and (select private.is_active_admin())
);

create policy "active admins can delete b2c media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'b2c-media'
  and (select private.is_active_admin())
);
