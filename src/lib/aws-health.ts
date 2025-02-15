
import { toast } from "@/hooks/use-toast";
import { awsRegions, type AWSRegion } from "./aws-regions";

export const fetchAWSHealth = async () => {
  try {
    // This is mock data until we implement proper AWS Health API integration
    // In production, this should be replaced with actual AWS SDK calls
    const mockData: AWSRegion[] = awsRegions.map(region => ({
      ...region,
      status: Math.random() > 0.9 
        ? "issue" 
        : Math.random() > 0.95 
          ? "outage" 
          : "operational"
    }));

    return mockData;
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
