import { useEffect, useState, useCallback, useRef } from "react";
import RegionMap from "@/components/RegionMap";
import RegionSummary from "@/components/RegionSummary";
import StatusLog from "@/components/StatusLog";
import TestControls from "@/components/TestControls";
import { fetchAWSHealth, getLastUpdateTime as getAWSLastUpdateTime } from "@/lib/aws-health";
import { awsRegions } from "@/lib/aws-regions";
import {
  fetchAzureHealth,
  fetchGCPHealth,
  AZURE_REGIONS,
  GCP_REGIONS,
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

const NORMAL_REFRESH_RATE = 10 * 60 * 1000;
const ERROR_REFRESH_RATE  =  5 * 60 * 1000;

// ─── Provider meta ────────────────────────────────────────────────────────────

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

/**
 * Return all known regions for a provider as operational.
 * Used to populate the map immediately — before the fetch completes.
 */
function getDefaultRegions(provider: CloudProvider): RegionStatus[] {
  switch (provider) {
    case "aws":
      return awsRegions.map((r) => ({
        code: r.code,
        name: r.name,
        status: "operational",
        provider: "aws",
        location: r.location,
      }));
    case "azure":
      return AZURE_REGIONS.map((r) => ({
        ...r,
        status: "operational",
        provider: "azure",
      }));
    case "gcp":
      return GCP_REGIONS.map((r) => ({
        ...r,
        status: "operational",
        provider: "gcp",
      }));
  }
}

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
  const [fetchError, setFetchError] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>("aws");

  // All regions across all providers — kept in a ref so TestControls always
  // has the full list regardless of which provider tab is active
  const [allRegions, setAllRegions] = useState<RegionStatus[]>(() => [
    ...getDefaultRegions("aws"),
    ...getDefaultRegions("azure"),
    ...getDefaultRegions("gcp"),
  ]);

  // Seed with all regions immediately so map/TestControls work from first render
  const [healthData, setHealthData] = useState<RegionStatus[]>(
    () => getDefaultRegions("aws")
  );
  const [recentItems, setRecentItems] = useState<RSSItem[]>([]);
  const [simulatedItems, setSimulatedItems] = useState<RSSItem[]>([]);
  const [refreshInterval, setRefreshInterval] = useState(NORMAL_REFRESH_RATE);
  const [lastBuildDate, setLastBuildDate] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [simulatedIssues, setSimulatedIssues] = useState<
    Record<string, "issue" | "outage">
  >({});

  const simulatedIssuesRef = useRef(simulatedIssues);
  simulatedIssuesRef.current = simulatedIssues;

  const checkForErrors = useCallback(
    (data: RegionStatus[]) =>
      data.some((r) => r.status === "issue" || r.status === "outage"),
    []
  );

  const applySimulations = useCallback(
    (
      regions: RegionStatus[],
      issues: Record<string, "issue" | "outage">,
      provider: CloudProvider
    ): RegionStatus[] =>
      regions.map((r) => ({
        ...r,
        status: issues[r.code] ?? r.status,
        provider,
      })),
    []
  );

  const updateHealth = useCallback(
    async (
      provider: CloudProvider = selectedProvider,
      overrideIssues?: Record<string, "issue" | "outage">
    ) => {
      setFetchError(false);
      try {
        let data: CloudHealthResult | null = null;

        if (provider === "aws") {
          const raw = await fetchAWSHealth();
          if (raw) {
            data = {
              regions: raw.regions.map((r) => ({
                code: r.code,
                name: r.name,
                status: r.status,
                provider: "aws" as CloudProvider,
                location: r.location,
              })),
              recentItems: raw.recentItems as RSSItem[],
              lastBuildDate: raw.lastBuildDate,
            };
          }
        } else if (provider === "azure") {
          data = await fetchAzureHealth();
        } else {
          data = await fetchGCPHealth();
        }

        const currentIssues = overrideIssues ?? simulatedIssuesRef.current;

        if (data) {
          // Persist to Supabase (fire-and-forget)
          upsertEvents(data.recentItems as RSSItem[]).catch(() => {});

          // Merge Supabase historical events with fresh feed
          const supabaseItems = await getRecentEvents(provider, 7, 100);
          const merged = mergeRSSItems(data.recentItems as RSSItem[], supabaseItems);

          const updatedRegions = applySimulations(data.regions, currentIssues, provider);
          setHealthData(updatedRegions);

          // Update the allRegions pool with fresh status for this provider
          setAllRegions((prev) => {
            const others = prev.filter((r) => r.provider !== provider);
            return [...others, ...updatedRegions];
          });

          setRecentItems([...simulatedItems, ...merged]);
          setLastBuildDate(data.lastBuildDate);
          setLastUpdateTime(getLastUpdateTime(provider));
          setRefreshInterval(
            checkForErrors(updatedRegions) ? ERROR_REFRESH_RATE : NORMAL_REFRESH_RATE
          );
        } else {
          // Fetch returned null (network/CORS failure) — keep default regions
          // but still apply any simulated issues so TestControls keeps working
          setHealthData((prev) => applySimulations(prev, currentIssues, provider));
          setFetchError(true);
        }
      } catch (error) {
        console.error("Failed to fetch health data:", error);
        setFetchError(true);
        // Keep existing healthData (default regions) so map stays usable
        setHealthData((prev) =>
          applySimulations(prev, simulatedIssuesRef.current, provider)
        );
      } finally {
        setLoading(false);
      }
    },
    [selectedProvider, simulatedItems, checkForErrors, applySimulations, toast]
  );

  // On provider change: immediately show default regions, then fetch live status
  useEffect(() => {
    setHealthData(getDefaultRegions(selectedProvider));
    setLoading(true);
    setFetchError(false);
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
            (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
          );
        });
      }
    });
    return unsubscribe;
  }, [selectedProvider]);

  const handleSimulateIssue = useCallback(
    (regionCode: string, status: "issue" | "outage", simulateProvider: CloudProvider) => {
      const newIssues = { ...simulatedIssuesRef.current, [regionCode]: status };
      setSimulatedIssues(newIssues);

      // Find region name from allRegions (works regardless of active provider tab)
      const region = allRegions.find((r) => r.code === regionCode && r.provider === simulateProvider);
      const regionName = region?.name ?? regionCode;

      const newItem: RSSItem = {
        title: `[TEST] ${status.toUpperCase()} detected in ${regionCode}`,
        description: `Simulated ${status} in the ${regionName} region for testing.`,
        pubDate: new Date().toUTCString(),
        guid: `test-${simulateProvider}-${regionCode}-${Date.now()}`,
        provider: simulateProvider,
      };

      setSimulatedItems((prev) => [newItem, ...prev]);
      toast({
        title: "Test Event Created",
        description: `Simulated ${status} for ${simulateProvider.toUpperCase()} ${regionCode}`,
      });

      // If simulating on the currently-visible provider, refresh the map
      if (simulateProvider === selectedProvider) {
        updateHealth(selectedProvider, newIssues);
      } else {
        // Update allRegions directly for the other provider
        setAllRegions((prev) =>
          prev.map((r) =>
            r.code === regionCode && r.provider === simulateProvider
              ? { ...r, status }
              : r
          )
        );
      }
    },
    [allRegions, selectedProvider, toast, updateHealth]
  );

  const handleProviderChange = useCallback((provider: CloudProvider) => {
    setSelectedProvider(provider);
    setSimulatedIssues({});
    setSimulatedItems([]);
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
                allRegions={allRegions}
                selectedProvider={selectedProvider}
                onSimulateIssue={handleSimulateIssue}
              />
            </div>
          </div>

          {/* Status / error bar */}
          <div className="mt-1 text-sm text-gray-500 space-y-1 text-center">
            {fetchError && (
              <p className="text-xs text-amber-600 font-medium">
                ⚠ Live feed unavailable — showing cached/default status.
                Regions are still selectable for simulation.
              </p>
            )}
            <p>Status updates every 10 minutes under normal conditions</p>
            <p className="text-xs text-gray-400">
              * Refresh rate automatically increases to every 5 minutes when
              issues or outages are detected
            </p>
            <div className="flex justify-center items-center gap-4 mt-2">
              {isSupabaseConfigured() && (
                <span className="text-xs text-green-600 font-medium">
                  ● Supabase active
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
