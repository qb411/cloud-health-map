
import { useEffect, useState, useCallback } from "react";
import RegionMap from "@/components/RegionMap";
import RegionSummary from "@/components/RegionSummary";
import StatusLog from "@/components/StatusLog";
import { fetchAWSHealth } from "@/lib/aws-health";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { AWSRegion } from "@/lib/aws-regions";
import type { RSSItem } from "@/lib/aws-health";

// Temporary test values
const NORMAL_REFRESH_RATE = 45 * 1000; // 45 seconds for testing
const ERROR_REFRESH_RATE = 45 * 1000;   // 45 seconds for testing

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<AWSRegion[]>([]);
  const [recentItems, setRecentItems] = useState<RSSItem[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(NORMAL_REFRESH_RATE);
  const [lastBuildDate, setLastBuildDate] = useState<string | null>(null);

  const checkForErrors = useCallback((data: AWSRegion[]) => {
    return data.some(region => region.status === 'issue' || region.status === 'outage');
  }, []);

  const updateHealth = useCallback(async () => {
    try {
      const data = await fetchAWSHealth();
      if (data) {
        setHealthData(data.regions);
        setRecentItems(data.recentItems);
        setLastBuildDate(data.lastBuildDate);
        
        // Adjust refresh rate based on health status
        const hasErrors = checkForErrors(data.regions);
        setRefreshInterval(hasErrors ? ERROR_REFRESH_RATE : NORMAL_REFRESH_RATE);

        // Log the update for testing
        console.log('Health data updated at:', new Date().toISOString());
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch health data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch AWS health status",
        variant: "destructive",
      });
    }
  }, [toast, checkForErrors]);

  useEffect(() => {
    updateHealth();
    const interval = setInterval(updateHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, updateHealth]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            AWS Global Health Status
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Real-time status of AWS services across regions
          </p>
          <div className="mt-1 text-sm text-gray-500 space-y-1">
            <p>Status updates every 15 minutes under normal conditions</p>
            <p className="text-xs text-gray-400">
              * Scanning frequency automatically increases to every 5 minutes when issues or outages are detected
            </p>
          </div>
        </div>
        
        <RegionSummary regions={healthData} />
        
        <div className="h-4" />
        
        <RegionMap regions={healthData} />

        <div className="h-8" />

        <StatusLog items={recentItems} lastBuildDate={lastBuildDate} />
      </div>
    </div>
  );
};

export default Index;
