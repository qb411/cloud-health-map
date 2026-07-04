import { useEffect, useState, useCallback, useRef } from "react";
import RegionMap from "@/components/RegionMap";
import RegionSummary from "@/components/RegionSummary";
import StatusLog from "@/components/StatusLog";
import TestControls from "@/components/TestControls";
import { fetchAWSHealth, getLastUpdateTime as getAWSLastUpdateTime } from "@/lib/aws-health";
import {
  fetchAzureHealth,
  fetchGCPHealth,
  type RegionStatus,
  type RSSItem,
  type CloudProvider,
  type CloudHealthResult,
  getAzureLastUpdateTime,
  getGCPLastUpdateTime,
} from "@/lib/cloud-health";
import { upsertEvents, getRecentEvents, subscribeToEvents } from "@/lib/event-store";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";

const NORMAL_REFRESH_RATE = 10 * 60 * 1000; // 10 minutes
const ERROR_REFRESH_RATE = 5 * 60 * 1000;   //  5 minutes when issues detected

// ─── Provider meta ─────────────────────────────────────────────────────────

const PROVIDER_META: Record<
  CloudProvider,
  { label: string; title: string; description: string; activeClass: string }
> = {
  aws: {
    label: "AWS",
    title: "AWS Global Health Status",
    description: "Real-time status of AWS services across global regions",
    activeClass: "bg-orange-500 text-white",
  },
  azure: {
    label: "Azure",
    title: "Azure Global Health Status",
    description: "Real-time status of Azure services across global regions",
    activeClass: "bg-blue-600 text-white",
  },
  gcp: {
    label: "GCP",
    title: "Google Cloud Platform Health Status",
    description: "Real-time status of GCP services across global regions",
    activeClass: "bg-green-600 text-white",
  },
};

const getLastUpdateTime = (provider: CloudProvider): string | null => {
  switch (provider) {
    case "aws":   return getAWSLastUpdateTime();
    case "azure": return getAzureLastUpdateTime();
    case "gcp":   return getGCPLastUpdateTime();
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>("aws");
  const [healthData, setHealthData] = useState<RegionStatus[]>([]);
  const [recentItems, setRecentItems] = useState<RSSItem[]>([]);
  const [simulatedItems, setSimulatedItems] = useState<RSSItem[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(NORMAL_REFRESH_RATE);
  const [lastBuildDate, setLastBuildDate] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [simulatedIssues, setSimulatedIssues] = useState<
    Record<string, "issue" | "outage">
  >({});

  // Keep a ref to simulatedIssues so callbacks always see the latest value
  // without needing it in their dependency arrays
  const simulatedIssuesRef = useRef(simulatedIssues);
  simulatedIssuesRef.current = simulatedIssues;

  const checkForErrors = useCallback((data: RegionStatus[]) =>
    data.some((r) => r.status === "issue" || r.status === "outage"),
  []);

  const updateHealth = useCallback(
    async (
      provider: CloudProvider = selectedProvider,
      overrideIssues?: Record<string, "issue" | "outage">
    ) => {
      try {
        let data: CloudHealthResult | null = null;

        if (provider === "aws") {
          const awsRaw = await fetchAWSHealth();
          if (awsRaw) {
            data = {
              regions: awsRaw.regions.map((r) => ({
                code: r.code,
                name: r.name,
                status: r.status,
                provider: "aws" as CloudProvider,
                location: r.location,
              })),
              recentItems: awsRaw.recentItems as RSSItem[],
              lastBuildDate: awsRaw.lastBuildDate,
            };
          }
        } else if (provider === "azure") {
          data = await fetchAzureHealth();
        } else {
          data = await fetchGCPHealth();
        }

        if (!data) return;

        // Persist new events to Supabase (non-blocking)
        upsertEvents(data.recentItems as RSSItem[]).catch(() => {});

        // Merge Supabase historical events with fresh feed items
        const supabaseItems = await getRecentEvents(provider, 7, 100);
        const merged = mergeRSSItems(data.recentItems as RSSItem[], supabaseItems);

        const currentIssues = overrideIssues ?? simulatedIssuesRef.current;

        const updatedRegions: RegionStatus[] = data.regions.map((region) => ({
          code: region.code,
          name: region.name,
          status: currentIssues[region.code] ?? region.status,
          provider,
          location: (region as RegionStatus).location,
        }));

        setHealthData(updatedRegions);
        setRecentItems([...simulatedItems, ...merged]);
        setLastBuildDate(data.lastBuildDate);
        setLastUpdateTime(getLastUpdateTime(provider));
        setRefreshInterval(
          checkForErrors(updatedRegions) ? ERROR_REFRESH_RATE : NORMAL_REFRESH_RATE
        );
      } catch (error) {
        console.error("Failed to fetch health data:", error);
        toast({
          title: "Error",
          description: `Failed to fetch ${provider.toUpperCase()} health status`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedProvider, simulatedItems, checkForErrors, toast]
  );

  // Initial load and refresh interval
  useEffect(() => {
    setLoading(true);
    updateHealth(selectedProvider);
    const interval = setInterval(
      () => updateHealth(selectedProvider),
      refreshInterval
    );
    return () => clearInterval(interval);
  }, [selectedProvider, refreshInterval, updateHealth]);

  // Supabase real-time subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const unsubscribe = subscribeToEvents((newItem) => {
      if (newItem.provider === selectedProvider) {
        setRecentItems((prev) => {
          const map = new Map(prev.map((i) => [i.guid, i]));
          map.set(newItem.guid, newItem);
          return Array.from(map.values()).sort(
            (a, b) =>
              new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
          );
        });
      }
    });
    return unsubscribe;
  }, [selectedProvider]);

  const handleSimulateIssue = useCallback(
    (regionCode: string, status: "issue" | "outage") => {
      const newIssues = { ...simulatedIssuesRef.current, [regionCode]: status };
      setSimulatedIssues(newIssues);

      const region = healthData.find((r) => r.code === regionCode);
      const regionName = region?.name ?? regionCode;

      const newItem: RSSItem = {
        title: `[TEST] ${status.toUpperCase()} detected in ${regionCode}`,
        description: `Simulated ${status} in the ${regionName} region for testing.`,
        pubDate: new Date().toUTCString(),
        guid: `test-${selectedProvider}-${regionCode}-${Date.now()}`,
        provider: selectedProvider,
      };

      setSimulatedItems((prev) => [newItem, ...prev]);
      toast({
        title: "Test Event Created",
        description: `Simulated ${status} for ${regionCode}`,
      });

      updateHealth(selectedProvider, newIssues);
    },
    [healthData, selectedProvider, toast, updateHealth]
  );

  const handleProviderChange = useCallback((provider: CloudProvider) => {
    setSelectedProvider(provider);
    setSimulatedIssues({});
    setSimulatedItems([]);
    setLoading(true);
  }, []);

  const handleManualRefresh = useCallback(() => {
    setLoading(true);
    updateHealth(selectedProvider);
  }, [selectedProvider, updateHealth]);

  const formatLastUpdate = (ts: string | null) =>
    ts ? new Date(ts).toLocaleString() : "Never";

  const meta = PROVIDER_META[selectedProvider];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1" />
            <div className="text-center flex-1">
              {/* Provider switcher */}
              <div className="flex justify-center gap-2 mb-4">
                {(["aws", "azure", "gcp"] as CloudProvider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedProvider === p
                        ? PROVIDER_META[p].activeClass
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {PROVIDER_META[p].label}
                  </button>
                ))}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {meta.title}
              </h1>
              <p className="mt-2 text-lg text-gray-600">{meta.description}</p>
            </div>
            <div className="flex-1 flex justify-end">
              <TestControls
                regions={healthData}
                onSimulateIssue={handleSimulateIssue}
              />
            </div>
          </div>

          {/* Status bar */}
          <div className="mt-1 text-sm text-gray-500 space-y-1 text-center">
            <p>Status updates every 10 minutes under normal conditions</p>
            <p className="text-xs text-gray-400">
              * Refresh rate automatically increases to every 5 minutes when
              issues or outages are detected
            </p>
            <div className="flex justify-center items-center gap-4 mt-2">
              {isSupabaseConfigured() && (
                <span className="text-xs text-green-600 font-medium">
                  ● Supabase persistence active
                </span>
              )}
              <p className="text-xs text-gray-400">
                Last update: {formatLastUpdate(lastUpdateTime)}
              </p>
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition-colors"
              >
                {loading ? "Refreshing…" : "Refresh now"}
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mergeRSSItems(a: RSSItem[], b: RSSItem[]): RSSItem[] {
  const map = new Map<string, RSSItem>();
  b.forEach((item) => map.set(item.guid, item));
  a.forEach((item) => map.set(item.guid, item));
  return Array.from(map.values()).sort(
    (x, y) => new Date(y.pubDate).getTime() - new Date(x.pubDate).getTime()
  );
}

export default Index;
