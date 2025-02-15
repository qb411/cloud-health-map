
import { toast } from "@/hooks/use-toast";
import { awsRegions, type AWSRegion } from "./aws-regions";

const AWS_RSS_URL = 'https://status.aws.amazon.com/rss/all.rss';

export type RSSItem = {
  title: string;
  description: string;
  pubDate: string;
  guid: string;
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

    // Start with all regions operational
    const regionStatus = new Map<string, "operational" | "issue" | "outage">();
    awsRegions.forEach(region => regionStatus.set(region.code, "operational"));

    // Fetch RSS feed with no-cache to ensure fresh data
    const response = await fetch(AWS_RSS_URL, {
      headers: {
        'Accept': 'application/rss+xml',
      },
      cache: 'no-store' // Ensure we don't get cached responses
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch AWS RSS feed');
    }

    const text = await response.text();
    console.log("Received RSS feed response"); // Debug log

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error("XML parsing error:", parseError);
      throw new Error('Failed to parse RSS feed');
    }

    const items = Array.from(xmlDoc.querySelectorAll("item"));
    console.log(`Found ${items.length} RSS items`); // Debug log

    // Process RSS items for status updates
    const rssItems: RSSItem[] = items.map(item => {
      const pubDate = item.querySelector("pubDate")?.textContent || "";
      console.log("Processing item with date:", pubDate); // Debug log
      return {
        title: item.querySelector("title")?.textContent || "",
        description: item.querySelector("description")?.textContent || "",
        pubDate: pubDate,
        guid: item.querySelector("guid")?.textContent || "",
      };
    });

    // Sort items by date (newest first)
    rssItems.sort((a, b) => {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

    // Process each RSS item for region status
    rssItems.forEach(item => {
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

    // Filter items from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentItems = rssItems
      .filter(item => new Date(item.pubDate) > sevenDaysAgo)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    if (recentItems.length > 0) {
      console.log("Most recent update:", {
        title: recentItems[0].title,
        date: recentItems[0].pubDate,
        timestamp: new Date(recentItems[0].pubDate).getTime()
      });
    } else {
      console.log("No recent items found");
    }

    return {
      regions,
      recentItems
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
