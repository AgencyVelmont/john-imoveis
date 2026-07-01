create schema if not exists private;

create table if not exists private.push_runtime_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  constraint push_runtime_settings_key_check check (
    key in ('send_push_function_url', 'send_push_secret')
  ),
  constraint push_runtime_settings_value_not_empty check (btrim(value) <> '')
);

revoke all on table private.push_runtime_settings from public, anon, authenticated;

create or replace function private.notify_new_lead_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, private
as $$
declare
  function_url text := current_setting('app.settings.send_push_function_url', true);
  push_secret text := current_setting('app.settings.send_push_secret', true);
  lead_record jsonb := to_jsonb(new);
  lead_payload jsonb;
begin
  if coalesce(function_url, '') = '' then
    select value into function_url
    from private.push_runtime_settings
    where key = 'send_push_function_url';
  end if;

  if coalesce(push_secret, '') = '' then
    select value into push_secret
    from private.push_runtime_settings
    where key = 'send_push_secret';
  end if;

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
