
import { useEffect, useState, useCallback } from "react";
import RegionMap from "@/components/RegionMap";
import RegionSummary from "@/components/RegionSummary";
import { fetchAWSHealth } from "@/lib/aws-health";
import { useToast } from "@/hooks/use-toast";
import type { AWSRegion } from "@/lib/aws-regions";

const NORMAL_REFRESH_RATE = 15 * 60 * 1000; // 15 minutes in milliseconds
const ERROR_REFRESH_RATE = 5 * 60 * 1000;   // 5 minutes in milliseconds

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<AWSRegion[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(NORMAL_REFRESH_RATE);

  const checkForErrors = useCallback((data: AWSRegion[]) => {
    return data.some(region => region.status === 'issue' || region.status === 'outage');
  }, []);

  const updateHealth = useCallback(async () => {
    try {
      const data = await fetchAWSHealth();
      if (data) {
        setHealthData(data);
        // Adjust refresh rate based on health status
        const hasErrors = checkForErrors(data);
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
          <p className="mt-1 text-sm text-gray-500">
            Updates every {refreshInterval === NORMAL_REFRESH_RATE ? '15' : '5'} minutes
          </p>
        </div>
        
        <RegionSummary />
        
        <div className="h-4" />
        
        <RegionMap regions={healthData} />
      </div>
    </div>
  );
};

export default Index;
