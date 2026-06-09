alter table public.leads enable row level security;

create policy "Public can insert leads"
on public.leads
for insert
to anon
with check (true);

create policy "Authenticated can read leads"
on public.leads
for select
to authenticated
using (true);

create policy "Authenticated can delete leads"
on public.leads
for delete
to authenticated
using (true);s