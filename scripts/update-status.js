#!/usr/bin/env node
/**
 * Cloud Health Map — Server-side RSS/API feed processor
 *
 * Runs as a GitHub Actions cron job (no browser CORS restrictions).
 * Fetches status data from AWS, Azure, GCP, and OCI, then upserts
 * incidents into the Supabase cloud_health_events table.
 *
 * Providers:
 *   AWS  — RSS XML  https://status.aws.amazon.com/rss/all.rss
 *   Azure— RSS XML  https://status.azure.com/en-us/status/feed/
 *   GCP  — JSON API https://status.cloud.google.com/incidents.json
 *   OCI  — JSON API https://ocistatus.oraclecloud.com/api/v2/status.json
 */

import { createClient } from "@supabase/supabase-js";
import { parseStringPromise } from "xml2js";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Service role key bypasses RLS — safe for server-side use only
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PROVIDERS = {
  aws: {
    name: "AWS",
    url: "https://status.aws.amazon.com/rss/all.rss",
    type: "xml",
    parser: parseAWSFeed,
  },
  azure: {
    name: "Azure",
    url: "https://status.azure.com/en-us/status/feed/",
    type: "xml",
    parser: parseAzureFeed,
  },
  gcp: {
    name: "GCP",
    url: "https://status.cloud.google.com/incidents.json",
    type: "json",
    parser: parseGCPFeed,
  },
  oci: {
    name: "OCI",
    url: "https://ocistatus.oraclecloud.com/api/v2/status.json",
    type: "json",
    parser: parseOCIFeed,
  },
};

// ─── Region mappings (176 regions: AWS 37, Azure 59, GCP 41, OCI 39) ─────────

const REGION_MAPPINGS = {
  aws: {
    "us-east-1": "US East (N. Virginia)",
    "us-east-2": "US East (Ohio)",
    "us-west-1": "US West (N. California)",
    "us-west-2": "US West (Oregon)",
    "eu-west-1": "Europe (Ireland)",
    "eu-central-1": "Europe (Frankfurt)",
    "ap-southeast-1": "Asia Pacific (Singapore)",
    "ap-northeast-1": "Asia Pacific (Tokyo)",
    "ca-central-1": "Canada Central (Montreal)",
    "ca-west-1": "Canada West (Calgary)",
    "sa-east-1": "South America (São Paulo)",
    "mx-central-1": "Mexico (Central)",
    "us-gov-east-1": "AWS GovCloud (US-East)",
    "us-gov-west-1": "AWS GovCloud (US-West)",
    "eu-west-2": "Europe (London)",
    "eu-west-3": "Europe (Paris)",
    "eu-south-1": "Europe (Milan)",
    "eu-south-2": "Europe (Spain)",
    "eu-north-1": "Europe (Stockholm)",
    "eu-central-2": "Europe (Zurich)",
    "me-south-1": "Middle East (Bahrain)",
    "me-central-1": "Middle East (UAE)",
    "il-central-1": "Israel (Tel Aviv)",
    "af-south-1": "Africa (Cape Town)",
    "ap-east-1": "Asia Pacific (Hong Kong)",
    "ap-south-2": "Asia Pacific (Hyderabad)",
    "ap-southeast-3": "Asia Pacific (Jakarta)",
    "ap-southeast-5": "Asia Pacific (Malaysia)",
    "ap-south-1": "Asia Pacific (Mumbai)",
    "ap-northeast-3": "Asia Pacific (Osaka)",
    "ap-northeast-2": "Asia Pacific (Seoul)",
    "ap-east-2": "Asia Pacific (Taipei)",
    "ap-southeast-7": "Asia Pacific (Thailand)",
    "ap-southeast-4": "Asia Pacific (Melbourne)",
    "ap-southeast-2": "Asia Pacific (Sydney)",
    "cn-north-1": "China (Beijing)",
    "cn-northwest-1": "China (Ningxia)",
  },
  azure: {
    "eastus": "East US", "westus2": "West US 2", "westeurope": "West Europe",
    "southeastasia": "Southeast Asia", "australiacentral": "Australia Central",
    "australiacentral2": "Australia Central 2", "australiaeast": "Australia East",
    "australiasoutheast": "Australia Southeast", "austriaeast": "Austria East",
    "belgiumcentral": "Belgium Central", "brazilsouth": "Brazil South",
    "brazilsoutheast": "Brazil Southeast", "canadacentral": "Canada Central",
    "canadaeast": "Canada East", "centralindia": "Central India",
    "centralus": "Central US", "chilecentral": "Chile Central",
    "eastasia": "East Asia", "eastus2": "East US 2",
    "francecentral": "France Central", "francesouth": "France South",
    "germanynorth": "Germany North", "germanywestcentral": "Germany West Central",
    "indonesiacentral": "Indonesia Central", "israelcentral": "Israel Central",
    "italynorth": "Italy North", "japaneast": "Japan East",
    "japanwest": "Japan West", "koreacentral": "Korea Central",
    "koreasouth": "Korea South", "malaysiawest": "Malaysia West",
    "mexicocentral": "Mexico Central", "newzealandnorth": "New Zealand North",
    "northcentralus": "North Central US", "northeurope": "North Europe",
    "norwayeast": "Norway East", "norwaywest": "Norway West",
    "polandcentral": "Poland Central", "qatarcentral": "Qatar Central",
    "southafricanorth": "South Africa North", "southafricawest": "South Africa West",
    "southcentralus": "South Central US", "southindia": "South India",
    "spaincentral": "Spain Central", "swedencentral": "Sweden Central",
    "switzerlandnorth": "Switzerland North", "switzerlandwest": "Switzerland West",
    "uaecentral": "UAE Central", "uaenorth": "UAE North",
    "uksouth": "UK South", "ukwest": "UK West",
    "westcentralus": "West Central US", "westindia": "West India",
    "westus": "West US", "westus3": "West US 3",
    "eastus3": "East US 3", "finlandcentral": "Finland Central",
    "denmarkeast": "Denmark East", "taiwannorth": "Taiwan North",
  },
  gcp: {
    "us-central1": "us-central1 (Iowa)", "us-east1": "us-east1 (South Carolina)",
    "europe-west1": "europe-west1 (Belgium)", "asia-east1": "asia-east1 (Taiwan)",
    "northamerica-northeast1": "northamerica-northeast1 (Montreal)",
    "northamerica-northeast2": "northamerica-northeast2 (Toronto)",
    "us-east4": "us-east4 (Northern Virginia)", "us-south1": "us-south1 (Dallas)",
    "us-west1": "us-west1 (Oregon)", "us-west3": "us-west3 (Salt Lake City)",
    "us-west4": "us-west4 (Las Vegas)", "us-west2": "us-west2 (Los Angeles)",
    "europe-west2": "europe-west2 (London)", "europe-west3": "europe-west3 (Frankfurt)",
    "asia-southeast1": "asia-southeast1 (Singapore)", "asia-northeast1": "asia-northeast1 (Tokyo)",
    "us-east5": "us-east5 (Columbus)", "northamerica-south1": "northamerica-south1 (Querétaro)",
    "southamerica-east1": "southamerica-east1 (São Paulo)",
    "southamerica-west1": "southamerica-west1 (Santiago)",
    "europe-central2": "europe-central2 (Warsaw)", "europe-north1": "europe-north1 (Finland)",
    "europe-southwest1": "europe-southwest1 (Madrid)", "europe-west4": "europe-west4 (Amsterdam)",
    "europe-west6": "europe-west6 (Zurich)", "europe-west8": "europe-west8 (Milan)",
    "europe-west9": "europe-west9 (Paris)", "europe-west10": "europe-west10 (Berlin)",
    "europe-west12": "europe-west12 (Turin)", "asia-east2": "asia-east2 (Hong Kong)",
    "asia-northeast2": "asia-northeast2 (Osaka)", "asia-northeast3": "asia-northeast3 (Seoul)",
    "asia-south1": "asia-south1 (Mumbai)", "asia-south2": "asia-south2 (Delhi)",
    "asia-southeast2": "asia-southeast2 (Jakarta)",
    "australia-southeast1": "australia-southeast1 (Sydney)",
    "australia-southeast2": "australia-southeast2 (Melbourne)",
    "me-central1": "me-central1 (Doha)", "me-central2": "me-central2 (Dammam)",
    "me-west1": "me-west1 (Tel Aviv)", "africa-south1": "africa-south1 (Johannesburg)",
  },
  oci: {
    "us-ashburn-1": "US East (Ashburn)", "us-phoenix-1": "US West (Phoenix)",
    "eu-frankfurt-1": "Germany Central (Frankfurt)", "ca-montreal-1": "Canada Central (Montreal)",
    "us-sanjose-1": "US West (San Jose)", "us-chicago-1": "US Central (Chicago)",
    "uk-london-1": "UK South (London)", "ap-tokyo-1": "Japan East (Tokyo)",
    "ap-sydney-1": "Australia East (Sydney)", "ca-toronto-1": "Canada Southeast (Toronto)",
    "mx-queretaro-1": "Mexico Central (Querétaro)", "mx-monterrey-1": "Mexico North (Monterrey)",
    "sa-saopaulo-1": "Brazil Southeast (São Paulo)", "sa-vinhedo-1": "Brazil Southeast (Vinhedo)",
    "sa-santiago-1": "Chile Central (Santiago)", "sa-valparaiso-1": "Chile West (Valparaíso)",
    "sa-bogota-1": "Colombia Central (Bogotá)", "uk-cardiff-1": "UK West (Cardiff)",
    "eu-amsterdam-1": "Netherlands West (Amsterdam)", "eu-paris-1": "France Central (Paris)",
    "eu-marseille-1": "France South (Marseille)", "eu-milan-1": "Italy North (Milan)",
    "eu-madrid-1": "Spain Central (Madrid)", "eu-madrid-2": "Spain Central 2 (Madrid)",
    "eu-zurich-1": "Switzerland North (Zurich)", "eu-stockholm-1": "Sweden Central (Stockholm)",
    "eu-jovanovac-1": "Serbia Central (Jovanovac)", "ap-osaka-1": "Japan West (Osaka)",
    "ap-seoul-1": "South Korea Central (Seoul)", "ap-chuncheon-1": "South Korea Northeast (Chuncheon)",
    "ap-mumbai-1": "India West (Mumbai)", "ap-hyderabad-1": "India Central (Hyderabad)",
    "ap-singapore-1": "Singapore", "ap-melbourne-1": "Australia Southeast (Melbourne)",
    "me-dubai-1": "UAE North (Dubai)", "me-abudhabi-1": "UAE Central (Abu Dhabi)",
    "me-jeddah-1": "Saudi Arabia West (Jeddah)", "il-jerusalem-1": "Israel Central (Jerusalem)",
    "af-johannesburg-1": "South Africa Central (Johannesburg)",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RESOLVED_KEYWORDS = ["resolved", "restored", "completed", "fixed", "mitigated"];
const ACTIVE_KEYWORDS   = ["investigating", "identified", "monitoring", "ongoing", "experiencing", "mitigating", "preliminary"];

const isResolved = (text) => RESOLVED_KEYWORDS.some((k) => text.includes(k));
const isActive   = (text) => ACTIVE_KEYWORDS.some((k) => text.includes(k));

function classifyStatus(text) {
  if (text.includes("outage") || text.includes("unavailable") || text.includes("major impact"))
    return "outage";
  if (text.includes("degraded") || text.includes("elevated error") || text.includes("intermittent") ||
      text.includes("performance issues"))
    return "issue";
  return "operational";
}

function regionName(provider, id) {
  return REGION_MAPPINGS[provider]?.[id] ?? id;
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

async function parseAWSFeed(xmlData, provider) {
  const items = xmlData?.rss?.channel?.[0]?.item ?? [];
  const events = [];

  for (const item of items) {
    try {
      const title       = item.title?.[0] ?? "";
      const description = item.description?.[0] ?? "";
      const pubDate     = item.pubDate?.[0];
      const guid        = item.guid?.[0]?._ ?? item.guid?.[0] ?? crypto.randomUUID();
      const text        = `${title} ${description}`.toLowerCase();

      if (isResolved(text)) continue;
      const status = classifyStatus(text);
      if (status === "operational" && !isActive(text)) continue;

      const regionMatch = title.match(/\[([\w-]+)\]/);
      const regionId = regionMatch?.[1] ?? "global";

      events.push({
        guid,
        title,
        description,
        pub_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        provider,
      });
    } catch (e) {
      console.warn("⚠ Skipping malformed AWS item:", e.message);
    }
  }
  return events;
}

async function parseAzureFeed(xmlData, provider) {
  const items = xmlData?.rss?.channel?.[0]?.item ?? [];
  const events = [];

  for (const item of items) {
    try {
      const title       = item.title?.[0] ?? "";
      const description = item.description?.[0] ?? "";
      const pubDate     = item.pubDate?.[0];
      const guid        = item.guid?.[0]?._ ?? item.guid?.[0] ?? crypto.randomUUID();
      const text        = `${title} ${description}`.toLowerCase();

      if (isResolved(text)) continue;
      const status = classifyStatus(text);
      if (status === "operational" && !isActive(text)) continue;

      events.push({
        guid,
        title,
        description,
        pub_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        provider,
      });
    } catch (e) {
      console.warn("⚠ Skipping malformed Azure item:", e.message);
    }
  }
  return events;
}

async function parseGCPFeed(jsonData, provider) {
  if (!Array.isArray(jsonData)) return [];
  const events = [];

  for (const incident of jsonData) {
    try {
      // Skip resolved incidents (GCP uses explicit end timestamp)
      if (incident.end) continue;

      const impact = incident.status_impact?.toLowerCase() ?? "";
      if (impact === "service_information") continue;

      let status = "operational";
      if (impact === "service_outage")     status = "outage";
      else if (impact === "service_disruption") status = "issue";
      if (status === "operational") continue;

      const title       = incident.summary ?? incident.external_desc ?? "GCP Incident";
      const description = incident.most_recent_update?.text ?? incident.external_desc ?? title;
      const guid        = incident.id ?? crypto.randomUUID();

      events.push({
        guid,
        title,
        description,
        pub_date: incident.begin ? new Date(incident.begin).toISOString() : new Date().toISOString(),
        provider,
      });
    } catch (e) {
      console.warn("⚠ Skipping malformed GCP incident:", e.message);
    }
  }
  return events;
}

async function parseOCIFeed(jsonData, provider) {
  const incidents = jsonData?.incidents ?? [];
  const events = [];

  for (const incident of incidents) {
    try {
      const name   = incident.name ?? "";
      const body   = incident.incident_updates?.[0]?.body ?? "";
      const status = incident.status?.toLowerCase() ?? "";
      const text   = `${name} ${body} ${status}`.toLowerCase();

      if (isResolved(text) || status === "resolved") continue;

      const impact = incident.impact?.toLowerCase() ?? "";
      let severity = "operational";
      if (impact === "major" || impact === "critical" || status === "major_outage")
        severity = "outage";
      else if (impact === "minor" || impact === "moderate" || isActive(text))
        severity = "issue";
      if (severity === "operational") continue;

      const guid = incident.id ?? crypto.randomUUID();

      events.push({
        guid,
        title: name,
        description: body || name,
        pub_date: incident.created_at ? new Date(incident.created_at).toISOString() : new Date().toISOString(),
        provider,
      });
    } catch (e) {
      console.warn("⚠ Skipping malformed OCI incident:", e.message);
    }
  }
  return events;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchProvider(id, config) {
  const res = await fetch(config.url, {
    headers: { "User-Agent": "CloudHealthMap/3.0 (+https://github.com/qb411/cloud-health-map)" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  if (config.type === "json") {
    const json = await res.json();
    return config.parser(json, id);
  } else {
    const text = await res.text();
    const xml  = await parseStringPromise(text);
    return config.parser(xml, id);
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

async function storeEvents(events) {
  if (events.length === 0) return 0;

  const { error, count } = await supabase
    .from("cloud_health_events")
    .upsert(events, { onConflict: "guid", ignoreDuplicates: true })
    .select("id", { count: "exact", head: true });

  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
  return count ?? 0;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Cloud Health Map — RSS feed processor");
  console.log(`📅 ${new Date().toISOString()}`);

  let totalNew = 0;
  let errors   = 0;

  for (const [id, config] of Object.entries(PROVIDERS)) {
    try {
      console.log(`\n📡 Fetching ${config.name}...`);
      const events = await fetchProvider(id, config);
      const stored = await storeEvents(events);
      console.log(`✅ ${config.name}: ${events.length} active incidents → ${stored} new stored`);
      totalNew += stored;
    } catch (e) {
      console.error(`❌ ${config.name} failed: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Done — ${totalNew} new events stored, ${errors} provider errors`);

  if (errors === Object.keys(PROVIDERS).length) {
    // All providers failed — something systemic
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("💥 Fatal:", e);
  process.exit(1);
});
