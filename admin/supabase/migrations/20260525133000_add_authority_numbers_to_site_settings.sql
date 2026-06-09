alter table site_settings
add column if not exists experience_years integer default 8,
add column if not exists properties_count integer default 200,
add column if not exists clients_count integer default 0,
add column if not exists neighborhoods_count integer default 0;

update site_settings
set
  experience_years = coalesce(experience_years, 8),
  properties_count = coalesce(properties_count, 200),
  clients_count = coalesce(clients_count, 0),
  neighborhoods_count = coalesce(neighborhoods_count, 0),
  updated_at = now()
where id = 'main';
