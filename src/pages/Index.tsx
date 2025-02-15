
import { useEffect, useState, useCallback } from "react";
import RegionMap from "@/components/RegionMap";
import RegionSummary from "@/components/RegionSummary";
import StatusLog from "@/components/StatusLog";
import { fetchAWSHealth } from "@/lib/aws-health";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { AWSRegion } from "@/lib/aws-regions";
import type { RSSItem } from "@/lib/aws-health";

const NORMAL_REFRESH_RATE = 15 * 60 * 1000; // 15 minutes in milliseconds
const ERROR_REFRESH_RATE = 5 * 60 * 1000;   // 5 minutes in milliseconds

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<AWSRegion[]>([]);
  const [recentItems, setRecentItems] = useState<RSSItem[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(NORMAL_REFRESH_RATE);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const checkForErrors = useCallback((data: AWSRegion[]) => {
    return data.some(region => region.status === 'issue' || region.status === 'outage');
  }, []);

  const updateHealth = useCallback(async () => {
    try {
      const data = await fetchAWSHealth();
      if (data) {
        setHealthData(data.regions);
        setRecentItems(data.recentItems);
        // Get the most recent update time from the RSS feed
        if (data.recentItems.length > 0) {
          setLastUpdateTime(new Date(data.recentItems[0].pubDate));
        }
        // Adjust refresh rate based on health status
        const hasErrors = checkForErrors(data.regions);
        setRefreshInterval(hasErrors ? ERROR_REFRESH_RATE : NORMAL_REFRESH_RATE);
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
    
    // Create an interval that will be updated when refreshInterval changes
    const interval = setInterval(updateHealth, refreshInterval);
    
    // Cleanup interval on unmount or when refreshInterval changes
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
            <p>Updates every {refreshInterval === NORMAL_REFRESH_RATE ? '15' : '5'} minutes</p>
            {lastUpdateTime && (
              <p>Last RSS feed update: {format(lastUpdateTime, "MMM d, yyyy HH:mm")}</p>
            )}
          </div>
        </div>
        
        <RegionSummary regions={healthData} />
        
        <div className="h-4" />
        
        <RegionMap regions={healthData} />

        <div className="h-8" />

        <StatusLog items={recentItems} />
      </div>
    </div>
  );
};

export default Index;
