
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

// Simulated RSS items based on historical AWS incidents
const simulatedRSSItems: RSSItem[] = [
  {
    title: "[RESOLVED] Network connectivity issues affecting multiple services in US-EAST-1",
    description: "Between 9:37 AM and 11:45 AM PDT, we experienced network connectivity issues in the US-EAST-1 Region that resulted in elevated error rates and latencies for multiple AWS services. The issue has been resolved and the services are operating normally.",
    pubDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toUTCString(), // 2 hours ago
    guid: "us-east-1-network-1"
  },
  {
    title: "Increased API Error Rates with EC2 in US-WEST-2",
    description: "We are experiencing elevated error rates with EC2 APIs in the US-WEST-2 (Oregon) region. The issue is affecting instance launches and management operations. Existing instances remain unaffected. Our teams are actively working on mitigating this issue.",
    pubDate: new Date(Date.now() - 30 * 60 * 1000).toUTCString(), // 30 mins ago
    guid: "us-west-2-ec2-1"
  },
  {
    title: "Degraded Performance: EC2 in US-EAST-1",
    description: "We continue to experience elevated error rates and latencies for EC2 operations in the US-EAST-1 region. Customer instances may experience delayed launch times and API calls may fail. We are actively investigating the root cause.",
    pubDate: new Date(Date.now() - 15 * 60 * 1000).toUTCString(), // 15 mins ago
    guid: "us-east-1-ec2-2"
  }
];

export const fetchAWSHealth = async () => {
  try {
    console.log("Starting AWS health fetch..."); // Debug log

    // Use awsRegions directly instead of resetting all to operational
    const regions = [...awsRegions];
    console.log("Initial region statuses:", regions.map(r => `${r.code}: ${r.status}`));

    // Simulate RSS feed fetch but return our simulated data
    console.log("Simulating RSS feed response with test data");

    // Use current time for lastBuildDate
    const lastBuildDate = new Date().toUTCString();
    console.log("RSS feed lastBuildDate:", lastBuildDate);

    // Filter items from the last 7 days and sort by date
    const recentItems = [...simulatedRSSItems]
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    console.log(`Found ${recentItems.length} RSS items`);

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
