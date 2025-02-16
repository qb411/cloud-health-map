
import { toast } from "@/hooks/use-toast";
import { awsRegions, type AWSRegion } from "./aws-regions";

const AWS_RSS_URL = 'https://status.aws.amazon.com/rss/all.rss';

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

export const fetchAWSHealth = async () => {
  try {
    console.log("Starting AWS health fetch..."); // Debug log

    // Use awsRegions directly instead of resetting all to operational
    const regions = [...awsRegions];
    console.log("Initial region statuses:", regions.map(r => `${r.code}: ${r.status}`));

    // Fetch RSS feed with no-cache to ensure fresh data
    const response = await fetch(AWS_RSS_URL, {
      headers: {
        'Accept': 'application/rss+xml',
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch AWS RSS feed');
    }

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

    // Process RSS items for status updates
    const rssItems: RSSItem[] = items.map(item => ({
      title: item.querySelector("title")?.textContent || "",
      description: item.querySelector("description")?.textContent || "",
      pubDate: item.querySelector("pubDate")?.textContent || "",
      guid: item.querySelector("guid")?.textContent || "",
    }));

    // Sort items by date (newest first)
    rssItems.sort((a, b) => {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    // Filter items from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentItems = rssItems
      .filter(item => new Date(item.pubDate) > sevenDaysAgo)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return {
      regions,
      recentItems,
      lastBuildDate
    };

  } catch (error) {
    console.error("Error fetching AWS health data:", error);
    toast({
      title: "Error",
      description: "Failed to fetch AWS health status. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
};
