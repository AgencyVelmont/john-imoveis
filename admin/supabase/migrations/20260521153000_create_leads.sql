create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete set null,
  name text not null,
  email text,
  phone text,
  message text,
  source text not null default 'site',
  status text not null default 'novo' check (
    status in (
      'novo',
      'contato',
      'visita_agendada',
      'proposta',
      'convertido',
      'perdido'
    )
  ),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_leads_property_id on leads(property_id);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_source on leads(source);
create index if not exists idx_leads_created_at on leads(created_at);

alter table leads enable row level security;

drop policy if exists "Authenticated users can read leads" on leads;
create policy "Authenticated users can read leads"
on leads for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert leads" on leads;
create policy "Authenticated users can insert leads"
on leads for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update leads" on leads;
create policy "Authenticated users can update leads"
on leads for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete leads" on leads;
create policy "Authenticated users can delete leads"
on leads for delete
to authenticated
using (true);

drop policy if exists "Public can create leads" on leads;
create policy "Public can create leads"
on leads for insert
to anon
with check (true);

drop policy if exists "Public can read published lead property" on properties;
create policy "Public can read published lead property"
on properties for select
to anon
using (status = 'publicado');
