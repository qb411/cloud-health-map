/**
 * event-store.ts — Supabase-backed persistence for cloud health events.
 *
 * FIRST-TIME SETUP: Run the following SQL in your Supabase SQL editor:
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * create table if not exists cloud_health_events (
 *   id          uuid primary key default gen_random_uuid(),
 *   guid        text not null unique,
 *   title       text not null,
 *   description text not null,
 *   pub_date    timestamptz not null,
 *   provider    text not null check (provider in ('aws', 'azure', 'gcp')),
 *   created_at  timestamptz not null default now()
 * );
 *
 * -- Index for fast recent-event queries per provider
 * create index if not exists idx_health_events_provider_date
 *   on cloud_health_events (provider, pub_date desc);
 *
 * -- Allow anonymous read/write (public dashboard, no auth required)
 * alter table cloud_health_events enable row level security;
 *
 * create policy "anon read" on cloud_health_events
 *   for select using (true);
 *
 * create policy "anon insert" on cloud_health_events
 *   for insert with check (true);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { subDays } from "date-fns";
import { supabase, isSupabaseConfigured } from "./supabase-client";
import type { RSSItem, CloudProvider } from "./cloud-health";

// ─── Types ────────────────────────────────────────────────────────────────────

type DbEvent = {
  id: string;
  guid: string;
  title: string;
  description: string;
  pub_date: string;
  provider: CloudProvider;
  created_at: string;
};

// ─── Upsert events ────────────────────────────────────────────────────────────

/**
 * Persist a batch of RSS items to Supabase, ignoring duplicates (by guid).
 * Safe to call on every fetch; existing guids are silently skipped.
 */
export const upsertEvents = async (items: RSSItem[]): Promise<void> => {
  if (!isSupabaseConfigured() || items.length === 0) return;

  const rows = items.map((item) => ({
    guid: item.guid,
    title: item.title,
    description: item.description,
    pub_date: new Date(item.pubDate).toISOString(),
    provider: item.provider,
  }));

  const { error } = await supabase!
    .from("cloud_health_events")
    .upsert(rows, { onConflict: "guid", ignoreDuplicates: true });

  if (error) {
    // Non-fatal — app still works via localStorage
    console.warn("Supabase upsert error:", error.message);
  }
};

// ─── Query events ─────────────────────────────────────────────────────────────

/**
 * Fetch the most recent events from Supabase for a given provider.
 * Falls back to an empty array if Supabase is not configured.
 */
export const getRecentEvents = async (
  provider: CloudProvider,
  daysBack = 7,
  limit = 100
): Promise<RSSItem[]> => {
  if (!isSupabaseConfigured()) return [];

  const since = subDays(new Date(), daysBack).toISOString();

  const { data, error } = await supabase!
    .from("cloud_health_events")
    .select("*")
    .eq("provider", provider)
    .gte("pub_date", since)
    .order("pub_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("Supabase query error:", error.message);
    return [];
  }

  return (data as DbEvent[]).map((row) => ({
    guid: row.guid,
    title: row.title,
    description: row.description,
    pubDate: new Date(row.pub_date).toUTCString(),
    provider: row.provider,
  }));
};

/**
 * Fetch the most recent events across ALL providers.
 */
export const getAllRecentEvents = async (
  daysBack = 7,
  limit = 200
): Promise<RSSItem[]> => {
  if (!isSupabaseConfigured()) return [];

  const since = subDays(new Date(), daysBack).toISOString();

  const { data, error } = await supabase!
    .from("cloud_health_events")
    .select("*")
    .gte("pub_date", since)
    .order("pub_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("Supabase query error:", error.message);
    return [];
  }

  return (data as DbEvent[]).map((row) => ({
    guid: row.guid,
    title: row.title,
    description: row.description,
    pubDate: new Date(row.pub_date).toUTCString(),
    provider: row.provider,
  }));
};

/**
 * Subscribe to real-time inserts on cloud_health_events.
 * Returns an unsubscribe function.
 */
export const subscribeToEvents = (
  onEvent: (item: RSSItem) => void
): (() => void) => {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase!
    .channel("cloud_health_events_realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "cloud_health_events" },
      (payload) => {
        const row = payload.new as DbEvent;
        onEvent({
          guid: row.guid,
          title: row.title,
          description: row.description,
          pubDate: new Date(row.pub_date).toUTCString(),
          provider: row.provider,
        });
      }
    )
    .subscribe();

  return () => {
    supabase!.removeChannel(channel);
  };
};
