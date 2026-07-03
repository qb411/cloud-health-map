import { useEffect, useState, useCallback } from "react";
import RegionMap from "@/components/RegionMap";
import RegionSummary from "@/components/RegionSummary";
import StatusLog from "@/components/StatusLog";
import TestControls from "@/components/TestControls";
import { fetchAWSHealth, getLastUpdateTime } from "@/lib/aws-health";
import { useToast } from "@/hooks/use-toast";
import { supabase, checkSupabaseConnection } from "@/integrations/supabase/client";
import type { AWSRegion } from "@/lib/aws-regions";
import type { RSSItem } from "@/lib/aws-health";
import type { TestSimulationInsert } from "@/integrations/supabase/types";

const NORMAL_REFRESH_RATE = parseInt(import.meta.env.VITE_REFRESH_INTERVAL_NORMAL) || 10 * 60 * 1000; // 10 minutes
const ERROR_REFRESH_RATE = parseInt(import.meta.env.VITE_REFRESH_INTERVAL_ERROR) || 5 * 60 * 1000;   // 5 minutes

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<AWSRegion[]>([]);
  const [recentItems, setRecentItems] = useState<RSSItem[]>([]);
  const [simulatedItems, setSimulatedItems] = useState<RSSItem[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(NORMAL_REFRESH_RATE);
  const [lastBuildDate, setLastBuildDate] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [simulatedIssues, setSimulatedIssues] = useState<Record<string, "issue" | "outage">>({});
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  const checkForErrors = useCallback((data: AWSRegion[]) => {
    return data.some(region => region.status === 'issue' || region.status === 'outage');
  }, []);

  const updateHealth = useCallback(async (customSimulatedIssues?: Record<string, "issue" | "outage">) => {
    try {
      const data = await fetchAWSHealth();
      if (data) {
        // Use custom simulated issues if provided, otherwise use state
        const currentSimulatedIssues = customSimulatedIssues || simulatedIssues;
        
        // Apply simulated issues over the fetched data
        const updatedRegions = data.regions.map(region => ({
          ...region,
          status: currentSimulatedIssues[region.code] || region.status
        }));
        
        console.log('Applied simulated issues:', currentSimulatedIssues);
        console.log('Updated regions:', updatedRegions.filter(r => r.status !== 'operational'));
        
        setHealthData(updatedRegions);
        
        // Combine simulated items with fetched items
        setRecentItems([...simulatedItems, ...data.recentItems]);
        setLastBuildDate(data.lastBuildDate);
        setLastUpdateTime(getLastUpdateTime());
        
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
      setLoading(false);
    }
  }, [toast, checkForErrors, simulatedIssues, simulatedItems]);

  const handleSimulateIssue = useCallback(async (regionCode: string, status: "issue" | "outage") => {
    console.log(`Simulating ${status} for region ${regionCode}`);
    
    try {
      // Get the region name from healthData
      const region = healthData.find(r => r.code === regionCode);
      const regionName = region ? region.name : regionCode;
      
      // Create simulation in database
      const simulation: TestSimulationInsert = {
        region_code: regionCode,
        simulated_status: status,
        description: `Simulated ${status} in the ${regionName} region for testing purposes.`,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Expire in 1 hour
        is_active: true
      };

      const { error: simError } = await supabase
        .from('test_simulations')
        .insert(simulation);

      if (simError) {
        console.error('Error creating simulation:', simError);
        throw simError;
      }

      // Create a simulated health event in database
      const now = new Date().toISOString();
      const simulatedEvent = {
        guid: `test-${regionCode}-${Date.now()}`,
        title: `[TEST] ${status.toUpperCase()} detected in ${regionCode}`,
        description: `This is a simulated ${status} in the ${regionName} region for testing purposes.`,
        pub_date: now,
        region_code: regionCode,
        status: status,
        source: 'test_simulation'
      };

      const { error: eventError } = await supabase
        .from('aws_health_events')
        .insert(simulatedEvent);

      if (eventError) {
        console.error('Error creating simulated event:', eventError);
        throw eventError;
      }

      // Update local state for immediate UI feedback
      const newSimulatedIssues = { ...simulatedIssues, [regionCode]: status };
      setSimulatedIssues(newSimulatedIssues);
      
      // Add to simulated items for immediate display
      const newItem: RSSItem = {
        title: simulatedEvent.title,
        description: simulatedEvent.description || '',
        pubDate: new Date(simulatedEvent.pub_date).toUTCString(),
        guid: simulatedEvent.guid
      };
      
      setSimulatedItems(prev => [newItem, ...prev]);
      
      toast({
        title: "Test Event Created",
        description: `Simulated ${status} for ${regionCode}`,
      });

      // Force an immediate health check
      updateHealth(newSimulatedIssues);
    } catch (error) {
      console.error('Failed to create simulation:', error);
      toast({
        title: "Simulation Error",
        description: "Failed to create test simulation. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, updateHealth, healthData, simulatedIssues, supabase]);

  const handleManualRefresh = useCallback(() => {
    setLoading(true);
    updateHealth();
  }, [updateHealth]);

  // Check database connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkSupabaseConnection();
      setDbConnected(connected);
      if (!connected) {
        toast({
          title: "Database Connection Error",
          description: "Unable to connect to Supabase. Please check your configuration.",
          variant: "destructive",
        });
      }
    };
    checkConnection();
  }, [toast]);

  // Subscribe to real-time updates from Supabase
  useEffect(() => {
    if (!dbConnected) return;

    const channel = supabase
      .channel('aws-health-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'aws_health_events' 
        }, 
        (payload) => {
          console.log('Real-time update received:', payload);
          // Refresh data when we receive updates
          updateHealth();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'region_status' 
        }, 
        (payload) => {
          console.log('Region status update received:', payload);
          // Refresh data when region status changes
          updateHealth();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dbConnected, updateHealth]);

  // Periodic refresh interval
  useEffect(() => {
    if (!dbConnected) return;
    
    updateHealth();
    const interval = setInterval(updateHealth, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, updateHealth, dbConnected]);

  const formatLastUpdate = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

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
            <p>Status updates every 10 minutes under normal conditions</p>
            <p className="text-xs text-gray-400">
              * Scanning frequency automatically increases to every 5 minutes when issues or outages are detected
            </p>
            <div className="flex justify-center items-center gap-4 mt-2">
              <p className="text-xs text-gray-400">
                Last update: {formatLastUpdate(lastUpdateTime)}
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-gray-400">
                  {dbConnected ? 'Database connected' : 'Database disconnected'}
                </span>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={loading || !dbConnected}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              >
                {loading ? "Refreshing..." : "Refresh now"}
              </button>
            </div>
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
