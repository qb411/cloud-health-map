import { awsRegions, type AWSRegion } from "./aws-regions";
import { subDays } from "date-fns";

// ─── Types (self-contained, no import from cloud-health) ──────────────────────

export type StatusType = "operational" | "issue" | "outage";

export type RSSItem = {
  title: string;
  description: string;
  pubDate: string;
  guid: string;
  provider: "aws";
};

export type AWSRegionWithStatus = AWSRegion & { status: StatusType };

export type AWSHealthData = {
  regions: AWSRegionWithStatus[];
  recentItems: RSSItem[];
  lastBuildDate: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const AWS_RSS_URL = "https://status.aws.amazon.com/rss/all.rss";
const CORS_PROXY = "https://api.allorigins.win/get?url=";
const STORAGE_KEY = "aws-health-items";
const STORAGE_TIMESTAMP_KEY = "aws-health-timestamp";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseRegionFromTitle = (title: string): string | null => {
  const matches = title.match(/\b([a-z]{2}-[a-z]+-\d+)\b/);
  return matches ? matches[1] : null;
};

const determineStatus = (description: string): StatusType => {
  const lower = description.toLowerCase();
  if (lower.includes("outage") || lower.includes("unavailable"))
    return "outage";
  if (lower.includes("degraded") || lower.includes("increased error"))
    return "issue";
  return "operational";
};

const fetchWithCorsProxy = async (url: string): Promise<Response> => {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/rss+xml" },
      cache: "no-store",
    });
    if (response.ok) return response;
    throw new Error("Direct fetch failed");
  } catch {
    console.log("Direct fetch failed, trying CORS proxy...");
    const proxyResponse = await fetch(
      `${CORS_PROXY}${encodeURIComponent(url)}`
    );
    if (!proxyResponse.ok) throw new Error("CORS proxy fetch failed");
    const data = await proxyResponse.json();
    return new Response(data.contents, {
      status: 200,
      headers: { "Content-Type": "application/rss+xml" },
    });
  }
};

const getStoredItems = (): RSSItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const items: RSSItem[] = JSON.parse(stored);
    const cutoff = subDays(new Date(), 7);
    return items.filter((item) => new Date(item.pubDate) > cutoff);
  } catch {
    return [];
  }
};

const storeItems = (items: RSSItem[]): void => {
  try {
    const cutoff = subDays(new Date(), 7);
    const filtered = items.filter((item) => new Date(item.pubDate) > cutoff);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
  } catch {
    // localStorage may be unavailable
  }
};

const mergeItems = (
  newItems: RSSItem[],
  existingItems: RSSItem[]
): RSSItem[] => {
  const itemMap = new Map<string, RSSItem>();
  existingItems.forEach((item) => itemMap.set(item.guid, item));
  newItems.forEach((item) => itemMap.set(item.guid, item));
  return Array.from(itemMap.values()).sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
};

// ─── Main fetch ───────────────────────────────────────────────────────────────

export const fetchAWSHealth = async (): Promise<AWSHealthData | null> => {
  try {
    const regionStatus = new Map<string, StatusType>();
    awsRegions.forEach((region) => regionStatus.set(region.code, "operational"));

    const response = await fetchWithCorsProxy(AWS_RSS_URL);
    const text = await response.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    if (xmlDoc.querySelector("parsererror")) {
      throw new Error("Failed to parse RSS feed");
    }

    const lastBuildDate =
      xmlDoc.querySelector("lastBuildDate")?.textContent ?? null;

    const newRssItems: RSSItem[] = Array.from(
      xmlDoc.querySelectorAll("item")
    ).map((item) => ({
      title: item.querySelector("title")?.textContent ?? "",
      description: item.querySelector("description")?.textContent ?? "",
      pubDate: item.querySelector("pubDate")?.textContent ?? "",
      guid: item.querySelector("guid")?.textContent ?? crypto.randomUUID(),
      provider: "aws" as const,
    }));

    const existingItems = getStoredItems();
    const allItems = mergeItems(newRssItems, existingItems);
    storeItems(allItems);

    // Only last 24h items affect region status
    const recentCutoff = subDays(new Date(), 1);
    allItems
      .filter((item) => new Date(item.pubDate) > recentCutoff)
      .forEach((item) => {
        const regionCode = parseRegionFromTitle(item.title);
        if (regionCode && regionStatus.has(regionCode)) {
          const status = determineStatus(item.description);
          const current = regionStatus.get(regionCode)!;
          if (
            current === "operational" ||
            (current === "issue" && status === "outage")
          ) {
            regionStatus.set(regionCode, status);
          }
        }
      });

    const regions: AWSRegionWithStatus[] = awsRegions.map((region) => ({
      ...region,
      status: regionStatus.get(region.code) ?? "operational",
    }));

    return { regions, recentItems: allItems.slice(0, 50), lastBuildDate };
  } catch (error) {
    console.error("Error fetching AWS health data:", error);

    const cachedItems = getStoredItems();
    if (cachedItems.length > 0) {
      return {
        regions: awsRegions.map((r) => ({ ...r, status: "operational" as const })),
        recentItems: cachedItems.slice(0, 50),
        lastBuildDate: null,
      };
    }
    return null;
  }
};

export const getLastUpdateTime = (): string | null =>
  localStorage.getItem(STORAGE_TIMESTAMP_KEY);
