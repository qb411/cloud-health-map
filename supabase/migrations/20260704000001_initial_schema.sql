-- Cloud Health Map v3 — initial schema
-- Multi-cloud health event persistence (AWS, Azure, GCP)

create table if not exists cloud_health_events (
  id          uuid primary key default gen_random_uuid(),
  guid        text not null unique,
  title       text not null,
  description text not null,
  pub_date    timestamptz not null,
  provider    text not null check (provider in ('aws', 'azure', 'gcp')),
  created_at  timestamptz not null default now()
);

-- Fast queries by provider + recency
create index if not exists idx_health_events_provider_date
  on cloud_health_events (provider, pub_date desc);

-- RLS: public read, public insert (anonymous dashboard, no auth required)
alter table cloud_health_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cloud_health_events' and policyname = 'anon read'
  ) then
    create policy "anon read"
      on cloud_health_events for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'cloud_health_events' and policyname = 'anon insert'
  ) then
    create policy "anon insert"
      on cloud_health_events for insert with check (true);
  end if;
end
$$;
