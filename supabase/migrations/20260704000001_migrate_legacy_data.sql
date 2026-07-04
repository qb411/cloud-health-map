-- Migration: old aws_health_events → cloud_health_events
--
-- Run this AFTER restoring the old backup to a temp schema, OR
-- run it directly if you restore the old backup into the same DB.
--
-- Assumes old table is accessible as: old_data.aws_health_events
-- (restore the backup into a schema called 'old_data' to keep things clean)
--
-- Steps:
--   1. psql -d [CONNECTION_STRING] -f old_backup.sql          (restores into public schema)
--   2. ALTER TABLE public.aws_health_events SET SCHEMA old_data;
--   3. psql -d [CONNECTION_STRING] -f migrate_old_data.sql    (this file)

insert into public.cloud_health_events (guid, title, description, pub_date, provider)
select
  -- Use existing guid, or generate one from the id if guid is null/empty
  coalesce(nullif(trim(guid), ''), 'aws-legacy-' || id::text)   as guid,
  title,
  coalesce(description, '')                                       as description,
  pub_date,
  'aws'                                                           as provider
from old_data.aws_health_events
where
  -- Only bring across events with valid dates
  pub_date is not null
  -- Skip rows older than 1 year (they're not useful for current monitoring)
  and pub_date > now() - interval '1 year'
on conflict (guid) do nothing;  -- safe to re-run

-- Report what was migrated
select
  provider,
  count(*)              as total_events,
  min(pub_date)         as oldest_event,
  max(pub_date)         as newest_event
from public.cloud_health_events
group by provider;
