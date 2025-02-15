
import { useEffect, useState } from "react";
import RegionMap from "@/components/RegionMap";
import RegionSummary from "@/components/RegionSummary";
import { fetchAWSHealth } from "@/lib/aws-health";
import { useToast } from "@/hooks/use-toast";
import type { AWSRegion } from "@/lib/aws-regions";

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<AWSRegion[]>([]);

  useEffect(() => {
    const updateHealth = async () => {
      try {
        const data = await fetchAWSHealth();
        if (data) {
          setHealthData(data);
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
    };

    updateHealth();
    const interval = setInterval(updateHealth, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [toast]);

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
        </div>
        
        <RegionSummary />
        
        <div className="h-4" />
        
        <RegionMap />
      </div>
    </div>
  );
};

export default Index;
