create table if not exists property_events (
  id uuid primary key default gen_random_uuid(),

  property_id uuid references properties(id) on delete cascade,

  event_type text not null,

  visitor_id text,

  source text,

  metadata jsonb default '{}'::jsonb,

  created_at timestamp with time zone default now()
);

create index if not exists idx_property_events_property_id
on property_events(property_id);

create index if not exists idx_property_events_event_type
on property_events(event_type);

create index if not exists idx_property_events_created_at
on property_events(created_at);

alter table property_events enable row level security;

create policy "Allow authenticated users full access to property_events"
on property_events
for all
to authenticated
using (true)
with check (true);

create policy "Allow public insert property_events"
on property_events
for insert
to anon
with check (true);

create policy "Allow public read property_events"
on property_events
for select
to anon
using (true);