revoke all on table public.push_subscriptions from anon, authenticated;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;

revoke all on table public.leads from anon, authenticated;
grant insert on table public.leads to anon;
grant select, insert, update, delete on table public.leads to authenticated;

revoke all on table public.site_settings from anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant insert, update, delete on table public.site_settings to authenticated;

revoke all on table private.push_runtime_settings from public, anon, authenticated;
