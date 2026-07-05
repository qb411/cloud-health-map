-- Add OCI as a supported provider
-- Drops and recreates the check constraint to include 'oci'

alter table cloud_health_events
  drop constraint if exists cloud_health_events_provider_check;

alter table cloud_health_events
  add constraint cloud_health_events_provider_check
  check (provider in ('aws', 'azure', 'gcp', 'oci'));
