alter table public.push_subscriptions
add column if not exists user_agent text,
add column if not exists updated_at timestamptz not null default now(),
add column if not exists last_used_at timestamptz,
add column if not exists active boolean not null default true;

alter table public.leads
add column if not exists notes_updated_at timestamptz,
add column if not exists notes_updated_by uuid references auth.users(id) on delete set null;

alter table public.site_settings
add column if not exists color_primary text not null default '#014340',
add column if not exists color_secondary text not null default '#8b8a78',
add column if not exists color_button text not null default '#014340',
add column if not exists color_accent text not null default '#f7bb7f',
add column if not exists color_text text not null default '#014340',
add column if not exists color_background text not null default '#f2f2f2',
add column if not exists color_surface text not null default '#fffaf7';

alter table public.site_settings
drop constraint if exists site_settings_color_primary_hex,
add constraint site_settings_color_primary_hex check (color_primary ~* '^#[0-9a-f]{6}$');

alter table public.site_settings
drop constraint if exists site_settings_color_secondary_hex,
add constraint site_settings_color_secondary_hex check (color_secondary ~* '^#[0-9a-f]{6}$');

alter table public.site_settings
drop constraint if exists site_settings_color_button_hex,
add constraint site_settings_color_button_hex check (color_button ~* '^#[0-9a-f]{6}$');

alter table public.site_settings
drop constraint if exists site_settings_color_accent_hex,
add constraint site_settings_color_accent_hex check (color_accent ~* '^#[0-9a-f]{6}$');

alter table public.site_settings
drop constraint if exists site_settings_color_text_hex,
add constraint site_settings_color_text_hex check (color_text ~* '^#[0-9a-f]{6}$');

alter table public.site_settings
drop constraint if exists site_settings_color_background_hex,
add constraint site_settings_color_background_hex check (color_background ~* '^#[0-9a-f]{6}$');

alter table public.site_settings
drop constraint if exists site_settings_color_surface_hex,
add constraint site_settings_color_surface_hex check (color_surface ~* '^#[0-9a-f]{6}$');

create index if not exists push_subscriptions_user_active_idx
on public.push_subscriptions (user_id, active);

create index if not exists push_subscriptions_last_used_at_idx
on public.push_subscriptions (last_used_at desc);

create index if not exists leads_notes_updated_at_idx
on public.leads (notes_updated_at desc)
where notes_updated_at is not null;

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_updated_at();

grant select on public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
grant insert on public.leads to anon;

create schema if not exists private;

create or replace function private.notify_new_lead_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  function_url text := current_setting('app.settings.send_push_function_url', true);
  push_secret text := current_setting('app.settings.send_push_secret', true);
  lead_record jsonb := to_jsonb(new);
  lead_payload jsonb;
begin
  if coalesce(function_url, '') = '' or coalesce(push_secret, '') = '' then
    return new;
  end if;

  lead_payload := jsonb_build_object(
    'id', lead_record ->> 'id',
    'name', coalesce(lead_record ->> 'name', lead_record ->> 'nome', 'Sem nome'),
    'phone', coalesce(lead_record ->> 'phone', lead_record ->> 'telefone', ''),
    'email', coalesce(lead_record ->> 'email', ''),
    'message', coalesce(lead_record ->> 'message', lead_record ->> 'mensagem', ''),
    'property_id', lead_record ->> 'property_id',
    'source', coalesce(lead_record ->> 'source', lead_record ->> 'origem', 'site'),
    'created_at', lead_record ->> 'created_at'
  );

  perform net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-send-push-secret', push_secret
    ),
    body := jsonb_build_object('lead', lead_payload)
  );

  return new;
end;
$$;

revoke all on function private.notify_new_lead_push() from public, anon, authenticated;

drop trigger if exists trg_notify_new_lead_push on public.leads;
create trigger trg_notify_new_lead_push
after insert on public.leads
for each row
execute function private.notify_new_lead_push();
