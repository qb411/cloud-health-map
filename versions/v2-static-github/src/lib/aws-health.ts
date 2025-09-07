import { toast } from "@/hooks/use-toast";
import { awsRegions, type AWSRegion } from "./aws-regions";
import { subDays } from "date-fns";

const AWS_RSS_URL = 'https://status.aws.amazon.com/rss/all.rss';
const CORS_PROXY = 'https://api.allorigins.win/get?url=';
const STORAGE_KEY = 'aws-health-items';
const STORAGE_TIMESTAMP_KEY = 'aws-health-timestamp';

export type RSSItem = {
  title: string;
  description: string;
  pubDate: string;
  guid: string;
};

export type AWSHealthData = {
  regions: AWSRegion[];
  recentItems: RSSItem[];
  lastBuildDate: string | null;
};

const parseRegionFromTitle = (title: string): string | null => {
  const matches = title.match(/\b([a-z]{2}-[a-z]+-\d+)\b/);
  return matches ? matches[1] : null;
};

const determineStatus = (description: string): "operational" | "issue" | "outage" => {
  const lowerDesc = description.toLowerCase();
  if (lowerDesc.includes("outage") || lowerDesc.includes("unavailable")) {
    return "outage";
  }
  if (lowerDesc.includes("degraded") || lowerDesc.includes("increased error")) {
    return "issue";
  }
  return "operational";
};

const fetchWithCorsProxy = async (url: string): Promise<Response> => {
  try {
    // Try direct fetch first
    const response = await fetch(url, {
      headers: { 'Accept': 'application/rss+xml' },
      cache: 'no-store'
    });
    if (response.ok) return response;
    throw new Error('Direct fetch failed');
  } catch (error) {
    console.log('Direct fetch failed, trying CORS proxy...');
    // Fallback to CORS proxy
    const proxyResponse = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    if (!proxyResponse.ok) throw new Error('CORS proxy fetch failed');
    
    const data = await proxyResponse.json();
    return new Response(data.contents, {
      status: 200,
      headers: { 'Content-Type': 'application/rss+xml' }
    });
  }
};

const getStoredItems = (): RSSItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const items: RSSItem[] = JSON.parse(stored);
    const cutoff = subDays(new Date(), 7);
    
    // Filter out items older than 7 days
    return items.filter(item => new Date(item.pubDate) > cutoff);
  } catch (error) {
    console.error('Error reading stored items:', error);
    return [];
  }
};

const storeItems = (items: RSSItem[]): void => {
  try {
    const cutoff = subDays(new Date(), 7);
    const filtered = items.filter(item => new Date(item.pubDate) > cutoff);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    localStorage.setItem(STORAGE_TIMESTAMP_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error storing items:', error);
  }
};

const mergeItems = (newItems: RSSItem[], existingItems: RSSItem[]): RSSItem[] => {
  const itemMap = new Map<string, RSSItem>();
  
  // Add existing items
  existingItems.forEach(item => itemMap.set(item.guid, item));
  
  // Add/update with new items
  newItems.forEach(item => itemMap.set(item.guid, item));
  
  // Convert back to array and sort by date
  return Array.from(itemMap.values()).sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
};

export const fetchAWSHealth = async (): Promise<AWSHealthData | null> => {
  try {
    console.log("Starting AWS health fetch...");

    // Start with all regions operational
    const regionStatus = new Map<string, "operational" | "issue" | "outage">();
    awsRegions.forEach(region => regionStatus.set(region.code, "operational"));

    // Fetch RSS feed
    const response = await fetchWithCorsProxy(AWS_RSS_URL);
    const text = await response.text();
    console.log("Received RSS feed response");

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error("XML parsing error:", parseError);
      throw new Error('Failed to parse RSS feed');
    }

    // Get lastBuildDate from channel metadata
    const lastBuildDate = xmlDoc.querySelector("lastBuildDate")?.textContent || null;
    console.log("RSS feed lastBuildDate:", lastBuildDate);

    const items = Array.from(xmlDoc.querySelectorAll("item"));
    console.log(`Found ${items.length} RSS items`);

    // Process RSS items
    const newRssItems: RSSItem[] = items.map(item => ({
      title: item.querySelector("title")?.textContent || "",
      description: item.querySelector("description")?.textContent || "",
      pubDate: item.querySelector("pubDate")?.textContent || "",
      guid: item.querySelector("guid")?.textContent || "",
    }));

    // Get existing items from localStorage
    const existingItems = getStoredItems();
    
    // Merge and store items
    const allItems = mergeItems(newRssItems, existingItems);
    storeItems(allItems);

    // Process items for region status (only recent items affect status)
    const recentCutoff = subDays(new Date(), 1); // Only last 24 hours affect status
    const recentItems = allItems.filter(item => new Date(item.pubDate) > recentCutoff);

    recentItems.forEach(item => {
      const regionCode = parseRegionFromTitle(item.title);
      if (regionCode && regionStatus.has(regionCode)) {
        const status = determineStatus(item.description);
        const currentStatus = regionStatus.get(regionCode);
        if (currentStatus === "operational" || 
            (currentStatus === "issue" && status === "outage")) {
          regionStatus.set(regionCode, status);
        }
      }
    });

    // Update region statuses
    const regions = awsRegions.map(region => ({
      ...region,
      status: regionStatus.get(region.code) || "operational"
    }));

    return {
      regions,
      recentItems: allItems.slice(0, 50), // Limit to 50 most recent items
      lastBuildDate
    };

  } catch (error) {
    console.error("Error fetching AWS health data:", error);
    toast({
      title: "Error",
      description: "Failed to fetch AWS health status. Please try again later.",
      variant: "destructive",
    });
    
    // Return cached data if available
    const cachedItems = getStoredItems();
    if (cachedItems.length > 0) {
      const regions = awsRegions.map(region => ({ ...region, status: "operational" as const }));
      return {
        regions,
        recentItems: cachedItems.slice(0, 50),
        lastBuildDate: null
      };
    }
    
    return null;
  }
};

export const getLastUpdateTime = (): string | null => {
  return localStorage.getItem(STORAGE_TIMESTAMP_KEY);
};
