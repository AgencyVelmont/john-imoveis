alter table leads
add column if not exists property_id uuid references properties(id) on delete set null;

create index if not exists idx_leads_property_id on leads(property_id);