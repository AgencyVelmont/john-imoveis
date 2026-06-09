create table if not exists site_settings (
  id text primary key default 'main',
  name text not null,
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table site_settings
add column if not exists whatsapp_message text,
add column if not exists address text,
add column if not exists city text,
add column if not exists state text,
add column if not exists created_at timestamp with time zone default now();

alter table site_settings enable row level security;

drop policy if exists "Public can read site settings" on site_settings;
create policy "Public can read site settings"
on site_settings for select
to anon, authenticated
using (id = 'main');

drop policy if exists "Authenticated users can manage site settings" on site_settings;
create policy "Authenticated users can manage site settings"
on site_settings for all
to authenticated
using (true)
with check (true);

insert into site_settings (
  id,
  name,
  creci,
  email,
  phone,
  instagram_url,
  site_url,
  bio
)
values (
  'main',
  'Felipe Vasconcelos',
  '',
  'contato@felipecorretor.com.br',
  '+55 93 9217-7692',
  'https://instagram.com/felipee.vasconcelos_',
  'https://felipecorretor.com.br',
  'Corretor de imóveis em Santarém-PA, com atuação em casas de alto padrão, apartamentos, terrenos e imóveis comerciais.'
)
on conflict (id) do update set
  name = excluded.name,
  creci = excluded.creci,
  email = excluded.email,
  phone = excluded.phone,
  instagram_url = excluded.instagram_url,
  site_url = excluded.site_url,
  bio = excluded.bio,
  updated_at = now();
