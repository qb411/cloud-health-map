import { toast } from "@/hooks/use-toast";
import { awsRegions, type AWSRegion } from "./aws-regions";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import type { AWSHealthEventInsert, RegionStatusUpdate } from "@/integrations/supabase/types";

const AWS_RSS_URL = import.meta.env.VITE_AWS_RSS_URL || 'https://status.aws.amazon.com/rss/all.rss';
const CORS_PROXY = import.meta.env.VITE_CORS_PROXY_URL || 'https://api.allorigins.win/get?url=';

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

const storeHealthEvents = async (items: RSSItem[]): Promise<void> => {
  try {
    // Convert RSS items to database format and store them
    const healthEvents: AWSHealthEventInsert[] = items.map(item => ({
      guid: item.guid,
      title: item.title,
      description: item.description,
      pub_date: new Date(item.pubDate).toISOString(),
      region_code: parseRegionFromTitle(item.title),
      status: determineStatus(item.description),
      source: 'aws_rss'
    }));

    // Use upsert to handle duplicates
    const { error } = await supabase
      .from('aws_health_events')
      .upsert(healthEvents, { 
        onConflict: 'guid',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Error storing health events:', error);
      throw error;
    }

    console.log(`Stored ${healthEvents.length} health events in database`);
  } catch (error) {
    console.error('Failed to store health events:', error);
    throw error;
  }
};

const getRecentHealthEvents = async (): Promise<RSSItem[]> => {
  try {
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();
    
    const { data, error } = await supabase
      .from('aws_health_events')
      .select('*')
      .gte('pub_date', sevenDaysAgo)
      .order('pub_date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching recent health events:', error);
      throw error;
    }

    // Convert database format back to RSS format
    return (data || []).map(event => ({
      title: event.title,
      description: event.description || '',
      pubDate: new Date(event.pub_date).toUTCString(),
      guid: event.guid
    }));
  } catch (error) {
    console.error('Failed to fetch recent health events:', error);
    return [];
  }
};

const updateRegionStatuses = async (regionStatusMap: Map<string, "operational" | "issue" | "outage">): Promise<void> => {
  try {
    const updates: RegionStatusUpdate[] = [];
    
    for (const [regionCode, status] of regionStatusMap.entries()) {
      updates.push({
        region_code: regionCode,
        current_status: status,
        last_status_change: new Date().toISOString()
      });
    }

    if (updates.length > 0) {
      const { error } = await supabase
        .from('region_status')
        .upsert(updates, { 
          onConflict: 'region_code' 
        });

      if (error) {
        console.error('Error updating region statuses:', error);
        throw error;
      }

      console.log(`Updated ${updates.length} region statuses`);
    }
  } catch (error) {
    console.error('Failed to update region statuses:', error);
    throw error;
  }
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

    // Store new items in database
    if (newRssItems.length > 0) {
      await storeHealthEvents(newRssItems);
    }

    // Get recent items from database
    const recentItems = await getRecentHealthEvents();

    // Process items for region status (only recent items affect status)
    const recentCutoff = subDays(new Date(), 1); // Only last 24 hours affect status
    const recentStatusItems = recentItems.filter(item => new Date(item.pubDate) > recentCutoff);

    recentStatusItems.forEach(item => {
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

    // Update region statuses in database
    await updateRegionStatuses(regionStatus);

    // Get current region statuses from database
    const { data: regionData, error: regionError } = await supabase
      .from('region_status')
      .select('*')
      .order('region_code');

    if (regionError) {
      console.error('Error fetching region statuses:', regionError);
      throw regionError;
    }

    // Map database region data to application format
    const regions: AWSRegion[] = (regionData || []).map(region => ({
      name: region.region_name,
      code: region.region_code,
      location: [region.longitude, region.latitude],
      status: region.current_status
    }));

    return {
      regions,
      recentItems: recentItems.slice(0, 50), // Limit to 50 most recent items
      lastBuildDate
    };

  } catch (error) {
    console.error("Error fetching AWS health data:", error);
    toast({
      title: "Error",
      description: "Failed to fetch AWS health status. Please try again later.",
      variant: "destructive",
    });
    
    // Try to return cached data from database
    try {
      const cachedItems = await getRecentHealthEvents();
      if (cachedItems.length > 0) {
        const regions = awsRegions.map(region => ({ ...region, status: "operational" as const }));
        return {
          regions,
          recentItems: cachedItems.slice(0, 50),
          lastBuildDate: null
        };
      }
    } catch (cacheError) {
      console.error("Failed to fetch cached data:", cacheError);
    }
    
    return null;
  }
};

export const getLastUpdateTime = (): string | null => {
  // Return current timestamp since we're using real-time database
  return new Date().toISOString();
};
