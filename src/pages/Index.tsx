import { useEffect, useState, useCallback, useRef } from "react";
import RegionMap from "@/components/RegionMap";
import RegionSummary from "@/components/RegionSummary";
import StatusLog from "@/components/StatusLog";
import TestControls from "@/components/TestControls";
import ThemeToggle from "@/components/ThemeToggle";
import { Maximize2, Minimize2 } from "lucide-react";
import { fetchAWSHealth, getLastUpdateTime as getAWSLastUpdateTime } from "@/lib/aws-health";
import { awsRegions } from "@/lib/aws-regions";
import {
  fetchAzureHealth,
  fetchGCPHealth,
  AZURE_REGIONS,
  GCP_REGIONS,
  OCI_REGIONS,
  type RegionStatus,
  type RSSItem,
  type CloudProvider,
  type CloudHealthResult,
  getAzureLastUpdateTime,
  getGCPLastUpdateTime,
  getOCILastUpdateTime,
} from "@/lib/cloud-health";
import { getRecentEvents, subscribeToEvents } from "@/lib/event-store";
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
  oci: {
    label: "OCI",
    title: "Oracle Cloud Infrastructure Health Status",
    description: "Real-time status of OCI services across global regions",
    activeClass: "bg-red-700 text-white",
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
    case "oci":
      return OCI_REGIONS.map((r) => ({
        ...r,
        status: "operational",
        provider: "oci",
      }));
  }
}

const getLastUpdateTime = (provider: CloudProvider): string | null => {
  switch (provider) {
    case "aws":   return getAWSLastUpdateTime();
    case "azure": return getAzureLastUpdateTime();
    case "gcp":   return getGCPLastUpdateTime();
    case "oci":   return getOCILastUpdateTime();
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [nocMode, setNocMode] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>("aws");

  // All regions across all providers — kept in a ref so TestControls always
  // has the full list regardless of which provider tab is active
  const [allRegions, setAllRegions] = useState<RegionStatus[]>(() => [
    ...getDefaultRegions("aws"),
    ...getDefaultRegions("azure"),
    ...getDefaultRegions("gcp"),
    ...getDefaultRegions("oci"),
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
        const currentIssues = overrideIssues ?? simulatedIssuesRef.current;

        // When Supabase is configured (live site), skip browser RSS fetch entirely.
        // The cron job writes events to Supabase every 10 min — we just read from there.
        // Browser-side RSS always fails on the live site due to CORS.
        if (isSupabaseConfigured()) {
          const supabaseItems = await getRecentEvents(provider, 7, 100);

          const defaultRegions = getDefaultRegions(provider);
          const regionStatusFromEvents = deriveRegionStatus(supabaseItems, defaultRegions);
          const updatedRegions = applySimulations(regionStatusFromEvents, currentIssues, provider);
          setHealthData(updatedRegions);

          setAllRegions((prev) => {
            const others = prev.filter((r) => r.provider !== provider);
            return [...others, ...updatedRegions];
          });

          setRecentItems([...simulatedItems, ...supabaseItems]);
          setLastUpdateTime(new Date().toISOString());
          setRefreshInterval(
            checkForErrors(updatedRegions) ? ERROR_REFRESH_RATE : NORMAL_REFRESH_RATE
          );
        } else {
          // Local dev without Supabase — try browser RSS fetch (may fail due to CORS)
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
          } else if (provider === "gcp") {
            data = await fetchGCPHealth();
          }

          if (data) {
            const updatedRegions = applySimulations(data.regions, currentIssues, provider);
            setHealthData(updatedRegions);
            setAllRegions((prev) => {
              const others = prev.filter((r) => r.provider !== provider);
              return [...others, ...updatedRegions];
            });
            setRecentItems([...simulatedItems, ...data.recentItems as RSSItem[]]);
            setLastBuildDate(data.lastBuildDate);
            setLastUpdateTime(getLastUpdateTime(provider));
            setRefreshInterval(
              checkForErrors(updatedRegions) ? ERROR_REFRESH_RATE : NORMAL_REFRESH_RATE
            );
          } else {
            setFetchError(true);
            setHealthData((prev) =>
              applySimulations(prev, currentIssues, provider)
            );
          }
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

  // NOC mode: ESC to exit, fullscreen API
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && nocMode) {
        setNocMode(false);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && nocMode) {
        setNocMode(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [nocMode]);

  const toggleNocMode = useCallback(() => {
    if (!nocMode) {
      setNocMode(true);
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      setNocMode(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [nocMode]);

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

  // Derive event counts per region from recent items
  const eventCounts = recentItems.reduce<Record<string, number>>((acc, item) => {
    for (const region of healthData) {
      const text = `${item.title} ${item.description} ${item.guid}`.toLowerCase();
      if (text.includes(region.code.toLowerCase())) {
        acc[region.code] = (acc[region.code] || 0) + 1;
      }
    }
    return acc;
  }, {});

  // ─── NOC Mode (fullscreen dashboard) ─────────────────────────────────────────
  if (nocMode) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-hidden">
        {/* NOC Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {(["aws", "azure", "gcp", "oci"] as CloudProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => handleProviderChange(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedProvider === p
                    ? PROVIDER_META[p].activeClass
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {PROVIDER_META[p].label}
              </button>
            ))}
          </div>
          <h1 className="text-xl font-bold text-gray-100 whitespace-nowrap">
            {meta.title}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {isSupabaseConfigured() && (
                <span className="text-green-500">● Live</span>
              )}
              <span>Updated: {formatLastUpdate(lastUpdateTime)}</span>
            </div>
            <button
              onClick={toggleNocMode}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
              title="Exit NOC mode (ESC)"
            >
              <Minimize2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* NOC Summary bar */}
        <div className="flex items-center justify-center gap-8 px-6 py-2 bg-gray-900/50">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-gray-300">
              <span className="text-lg font-bold text-emerald-400">{healthData.filter(r => r.status === "operational").length}</span> Operational
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-gray-300">
              <span className="text-lg font-bold text-amber-400">{healthData.filter(r => r.status === "issue").length}</span> Issues
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-gray-300">
              <span className="text-lg font-bold text-red-400">{healthData.filter(r => r.status === "outage").length}</span> Outages
            </span>
          </div>
        </div>

        {/* NOC Map — fills remaining space */}
        <div className="flex-1 min-h-0" style={{ height: 'calc(100vh - 88px)' }}>
          <RegionMap regions={healthData} eventCounts={eventCounts} className="w-full h-full rounded-none border-0 shadow-none bg-gray-950" />
        </div>
      </div>
    );
  }

  // ─── Normal Mode ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10" />
            <div className="text-center flex-1">
              {/* Provider switcher */}
              <div className="flex justify-center gap-2 mb-4">
                {(["aws", "azure", "gcp", "oci"] as CloudProvider[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedProvider === p
                        ? PROVIDER_META[p].activeClass
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {PROVIDER_META[p].label}
                  </button>
                ))}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl whitespace-nowrap">
                {meta.title}
              </h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">{meta.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={toggleNocMode}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="NOC display mode (fullscreen)"
              >
                <Maximize2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
              <TestControls
                allRegions={allRegions}
                selectedProvider={selectedProvider}
                onSimulateIssue={handleSimulateIssue}
              />
            </div>
          </div>

          {/* Status / error bar */}
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-300 space-y-1 text-center">
            {fetchError && (
              <p className="text-xs text-amber-600 font-medium">
                ⚠ Live feed unavailable — showing cached/default status.
                Regions are still selectable for simulation.
              </p>
            )}
            <p>Status updates every 10 minutes under normal conditions</p>
            <p className="text-xs text-gray-400 dark:text-gray-400">
              * Refresh rate automatically increases to every 5 minutes when
              issues or outages are detected
            </p>
            <div className="flex justify-center items-center gap-4 mt-2">
              {isSupabaseConfigured() && (
                <span className="text-xs text-green-600 font-medium">
                  ● Database live
                </span>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-400">
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

        <RegionMap regions={healthData} eventCounts={eventCounts} />

        <div className="h-8" />

        <StatusLog items={recentItems} lastBuildDate={lastBuildDate} />
      </div>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive region statuses from Supabase events when RSS feed is unavailable.
 * Scans event titles/descriptions for region codes and classifies severity.
 */
function deriveRegionStatus(events: RSSItem[], defaults: RegionStatus[]): RegionStatus[] {
  const statusMap = new Map<string, "operational" | "issue" | "outage">();

  for (const event of events) {
    const text = `${event.title} ${event.description}`.toLowerCase();

    // Try to find region codes in the text
    for (const region of defaults) {
      if (text.includes(region.code.toLowerCase()) || text.includes(region.name.toLowerCase())) {
        let status: "issue" | "outage" = "issue";
        if (text.includes("outage") || text.includes("unavailable") || text.includes("disruption")) {
          status = "outage";
        }
        const current = statusMap.get(region.code);
        if (!current || status === "outage") {
          statusMap.set(region.code, status);
        }
      }
    }
  }

  return defaults.map((r) => ({
    ...r,
    status: statusMap.get(r.code) ?? "operational",
  }));
}

export default Index;
