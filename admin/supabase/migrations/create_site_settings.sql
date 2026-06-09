create table if not exists site_settings (
  id text primary key default 'main',
  name text,
  creci text,
  email text,
  phone text,
  instagram_url text,
  site_url text,
  bio text,
  whatsapp_message text,
  address text,
  city text,
  state text,
  experience_years integer default 8,
  properties_count integer default 200,
  clients_count integer default 0,
  neighborhoods_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table site_settings
add column if not exists name text,
add column if not exists creci text,
add column if not exists email text,
add column if not exists phone text,
add column if not exists instagram_url text,
add column if not exists site_url text,
add column if not exists bio text,
add column if not exists whatsapp_message text,
add column if not exists address text,
add column if not exists city text,
add column if not exists state text,
add column if not exists experience_years integer default 8,
add column if not exists properties_count integer default 200,
add column if not exists clients_count integer default 0,
add column if not exists neighborhoods_count integer default 0,
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

alter table site_settings enable row level security;

drop policy if exists "Public can read site settings" on site_settings;
create policy "Public can read site settings"
on site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can insert site settings" on site_settings;
create policy "Authenticated users can insert site settings"
on site_settings
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update site settings" on site_settings;
create policy "Authenticated users can update site settings"
on site_settings
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete site settings" on site_settings;
create policy "Authenticated users can delete site settings"
on site_settings
for delete
to authenticated
using (true);

insert into site_settings (
  id,
  name,
  creci,
  email,
  phone,
  instagram_url,
  site_url,
  bio,
  whatsapp_message,
  address,
  city,
  state,
  experience_years,
  properties_count,
  clients_count,
  neighborhoods_count
)
values (
  'main',
  'Felipe Vasconcelos',
  'CRECI 12.235',
  'contato@felipecorretor.com.br',
  '+55 93 9217-7692',
  'https://instagram.com/felipee.vasconcelos_',
  'https://felipecorretor.com.br',
  'Corretor de imóveis em Santarém-PA, com atuação em casas de alto padrão, apartamentos, terrenos e imóveis comerciais.',
  'Olá Felipe, vim pelo site e gostaria de mais informações sobre um imóvel.',
  'Centro — Santarém, PA',
  'Santarém',
  'PA',
  8,
  200,
  0,
  0
)
on conflict (id) do update set
  name = coalesce(site_settings.name, excluded.name),
  creci = coalesce(site_settings.creci, excluded.creci),
  email = coalesce(site_settings.email, excluded.email),
  phone = coalesce(site_settings.phone, excluded.phone),
  instagram_url = coalesce(site_settings.instagram_url, excluded.instagram_url),
  site_url = coalesce(site_settings.site_url, excluded.site_url),
  bio = coalesce(site_settings.bio, excluded.bio),
  whatsapp_message = coalesce(site_settings.whatsapp_message, excluded.whatsapp_message),
  address = coalesce(site_settings.address, excluded.address),
  city = coalesce(site_settings.city, excluded.city),
  state = coalesce(site_settings.state, excluded.state),
  experience_years = coalesce(site_settings.experience_years, excluded.experience_years),
  properties_count = coalesce(site_settings.properties_count, excluded.properties_count),
  clients_count = coalesce(site_settings.clients_count, excluded.clients_count),
  neighborhoods_count = coalesce(site_settings.neighborhoods_count, excluded.neighborhoods_count),
  updated_at = now();
