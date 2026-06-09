create table if not exists property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  url text not null,
  storage_path text not null,
  sort_order integer default 0,
  is_cover boolean default false,
  created_at timestamp with time zone default now()
);

create index if not exists property_images_property_id_idx on property_images(property_id);

alter table properties enable row level security;
alter table property_images enable row level security;

drop policy if exists "Authenticated users can read properties" on properties;
create policy "Authenticated users can read properties"
on properties for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert properties" on properties;
create policy "Authenticated users can insert properties"
on properties for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update properties" on properties;
create policy "Authenticated users can update properties"
on properties for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete properties" on properties;
create policy "Authenticated users can delete properties"
on properties for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read property images" on property_images;
create policy "Authenticated users can read property images"
on property_images for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert property images" on property_images;
create policy "Authenticated users can insert property images"
on property_images for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update property images" on property_images;
create policy "Authenticated users can update property images"
on property_images for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete property images" on property_images;
create policy "Authenticated users can delete property images"
on property_images for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read property images" on storage.objects;
create policy "Public can read property images"
on storage.objects for select
to public
using (bucket_id = 'property-images');

drop policy if exists "Authenticated users can upload property images" on storage.objects;
create policy "Authenticated users can upload property images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'property-images');

drop policy if exists "Authenticated users can update property images storage" on storage.objects;
create policy "Authenticated users can update property images storage"
on storage.objects for update
to authenticated
using (bucket_id = 'property-images')
with check (bucket_id = 'property-images');

drop policy if exists "Authenticated users can delete property images storage" on storage.objects;
create policy "Authenticated users can delete property images storage"
on storage.objects for delete
to authenticated
using (bucket_id = 'property-images');
