create extension if not exists pg_net;

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

create index if not exists idx_push_subscriptions_user_id on push_subscriptions(user_id);
create index if not exists idx_push_subscriptions_created_at on push_subscriptions(created_at);

alter table push_subscriptions enable row level security;

drop policy if exists "Users can read own push subscriptions" on push_subscriptions;
create policy "Users can read own push subscriptions"
on push_subscriptions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own push subscriptions" on push_subscriptions;
create policy "Users can create own push subscriptions"
on push_subscriptions for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own push subscriptions" on push_subscriptions;
create policy "Users can update own push subscriptions"
on push_subscriptions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own push subscriptions" on push_subscriptions;
create policy "Users can delete own push subscriptions"
on push_subscriptions for delete
to authenticated
using (auth.uid() = user_id);

create or replace function notify_new_lead_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  function_url text := current_setting('app.settings.send_push_function_url', true);
  push_secret text := current_setting('app.settings.send_push_secret', true);
  lead_record jsonb := to_jsonb(new);
  lead_payload jsonb;
begin
  if coalesce(function_url, '') = '' then
    return new;
  end if;

  lead_payload := jsonb_build_object(
    'id', lead_record ->> 'id',
    'name', coalesce(lead_record ->> 'name', lead_record ->> 'nome', 'Sem nome'),
    'phone', coalesce(lead_record ->> 'phone', lead_record ->> 'telefone', ''),
    'message', coalesce(lead_record ->> 'message', lead_record ->> 'mensagem', ''),
    'property_id', lead_record ->> 'property_id',
    'source', coalesce(lead_record ->> 'source', lead_record ->> 'origem', 'website'),
    'created_at', lead_record ->> 'created_at'
  );

  perform net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-send-push-secret', coalesce(push_secret, '')
    ),
    body := jsonb_build_object('lead', lead_payload)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_new_lead_push on leads;
create trigger trg_notify_new_lead_push
after insert on leads
for each row
execute function notify_new_lead_push();
