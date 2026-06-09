alter table leads
add column if not exists property_id uuid references properties(id) on delete set null,
add column if not exists name text,
add column if not exists email text,
add column if not exists phone text,
add column if not exists message text,
add column if not exists source text default 'manual',
add column if not exists status text default 'novo',
add column if not exists notes text,
add column if not exists created_at timestamp with time zone default now(),
add column if not exists updated_at timestamp with time zone default now();

create index if not exists idx_leads_property_id on leads(property_id);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_source on leads(source);
create index if not exists idx_leads_created_at on leads(created_at);