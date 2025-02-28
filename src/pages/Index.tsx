
import { useEffect, useState, useCallback } from "react";
import RegionMap from "@/components/RegionMap";
import RegionSummary from "@/components/RegionSummary";
import StatusLog from "@/components/StatusLog";
import TestControls from "@/components/TestControls";
import { fetchAWSHealth } from "@/lib/aws-health";
import { useToast } from "@/hooks/use-toast";
import type { AWSRegion } from "@/lib/aws-regions";
import type { RSSItem } from "@/lib/aws-health";
import { supabase } from "@/integrations/supabase/client";

const NORMAL_REFRESH_RATE = 15 * 60 * 1000; // 15 minutes in milliseconds
const ERROR_REFRESH_RATE = 5 * 60 * 1000;   // 5 minutes in milliseconds

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<AWSRegion[]>([]);
  const [recentItems, setRecentItems] = useState<RSSItem[]>([]);
  const [simulatedItems, setSimulatedItems] = useState<RSSItem[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(NORMAL_REFRESH_RATE);
  const [lastBuildDate, setLastBuildDate] = useState<string | null>(null);
  const [simulatedIssues, setSimulatedIssues] = useState<Record<string, "issue" | "outage">>({});

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('aws-health-events')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'aws_health_events' 
        }, 
        () => {
          // Refresh data when we receive updates
          updateHealth();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkForErrors = useCallback((data: AWSRegion[]) => {
    return data.some(region => region.status === 'issue' || region.status === 'outage');
  }, []);

  const updateHealth = useCallback(async () => {
    try {
      const data = await fetchAWSHealth();
      if (data) {
        // Apply simulated issues over the fetched data
        const updatedRegions = data.regions.map(region => ({
          ...region,
          status: simulatedIssues[region.code] || region.status
        }));
        
        setHealthData(updatedRegions);
        
        // Combine simulated items with database items
        setRecentItems([...simulatedItems, ...data.recentItems]);
        setLastBuildDate(data.lastBuildDate);
        
        // Adjust refresh rate based on health status
        const hasErrors = checkForErrors(updatedRegions);
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
  }, [toast, checkForErrors, simulatedIssues, simulatedItems]);

  const handleSimulateIssue = useCallback((regionCode: string, status: "issue" | "outage") => {
    setSimulatedIssues(prev => ({ ...prev, [regionCode]: status }));
    
    // Get the region name from healthData
    const region = healthData.find(r => r.code === regionCode);
    const regionName = region ? region.name : regionCode;
    
    // Add a simulated RSS item
    const now = new Date().toUTCString();
    const newItem: RSSItem = {
      title: `[TEST] ${status.toUpperCase()} detected in ${regionCode}`,
      description: `This is a simulated ${status} in the ${regionName} region for testing purposes.`,
      pubDate: now,
      guid: `test-${regionCode}-${Date.now()}`
    };
    
    // Add the new item to simulated items
    setSimulatedItems(prev => [newItem, ...prev]);
    
    toast({
      title: "Test Event Created",
      description: `Simulated ${status} for ${regionCode}`,
    });

    // Force an immediate health check
    updateHealth();
  }, [toast, updateHealth, healthData]);

  useEffect(() => {
    updateHealth();
    const interval = setInterval(updateHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, updateHealth]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1" />
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                AWS Global Health Status
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Real-time status of AWS services across regions
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <TestControls 
                regions={healthData}
                onSimulateIssue={handleSimulateIssue}
              />
            </div>
          </div>
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
