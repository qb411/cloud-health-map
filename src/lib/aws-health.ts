
import { toast } from "@/hooks/use-toast";
import { awsRegions, type AWSRegion } from "./aws-regions";

const AWS_RSS_URL = 'https://status.aws.amazon.com/rss/all.rss';

type RSSItem = {
  title: string;
  description: string;
  pubDate: string;
  guid: string;
};

const parseRegionFromTitle = (title: string): string | null => {
  // Example: "[RESOLVED] EC2 in us-east-1"
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
    // Start with all regions operational
    const regionStatus = new Map<string, "operational" | "issue" | "outage">();
    awsRegions.forEach(region => regionStatus.set(region.code, "operational"));

    // Fetch RSS feed
    const response = await fetch(AWS_RSS_URL, {
      headers: {
        'Accept': 'application/rss+xml',
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch AWS RSS feed');
    }

    const text = await response.text();
    // Parse XML (basic implementation - in production use a proper XML parser)
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const items = Array.from(xmlDoc.querySelectorAll("item"));

    // Process each RSS item
    items.forEach(item => {
      const title = item.querySelector("title")?.textContent || "";
      const description = item.querySelector("description")?.textContent || "";
      const regionCode = parseRegionFromTitle(title);
      
      if (regionCode && regionStatus.has(regionCode)) {
        const status = determineStatus(description);
        // Only update if the new status is more severe
        const currentStatus = regionStatus.get(regionCode);
        if (currentStatus === "operational" || 
            (currentStatus === "issue" && status === "outage")) {
          regionStatus.set(regionCode, status);
        }
      }
    });

    // Simulate an outage in us-east-1 (N. Virginia)
    regionStatus.set("us-east-1", "outage");

    // Update region statuses
    return awsRegions.map(region => ({
      ...region,
      status: regionStatus.get(region.code) || "operational"
    }));

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
