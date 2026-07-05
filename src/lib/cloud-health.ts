import { subDays } from "date-fns";
import { fetchAWSHealth, getLastUpdateTime as getAWSLastUpdateTime } from "./aws-health";

// ─── Shared types ────────────────────────────────────────────────────────────

export type CloudProvider = "aws" | "azure" | "gcp" | "oci";
export type StatusType = "operational" | "issue" | "outage";

export type RSSItem = {
  title: string;
  description: string;
  pubDate: string;
  guid: string;
  provider: CloudProvider;
};

export type RegionStatus = {
  code: string;
  name: string;
  status: StatusType;
  provider: CloudProvider;
  location: [number, number];
};

export type CloudHealthResult = {
  regions: RegionStatus[];
  recentItems: RSSItem[];
  lastBuildDate: string | null;
};

// ─── Endpoints ───────────────────────────────────────────────────────────────

const AZURE_RSS_URL = "https://status.azure.com/rss/";
const GCP_API_URL = "https://status.cloud.google.com/generate_feed.php";
const CORS_PROXY = "https://api.allorigins.win/get?url=";

const AZURE_STORAGE_KEY = "azure-health-items";
const AZURE_TIMESTAMP_KEY = "azure-health-timestamp";
const GCP_STORAGE_KEY = "gcp-health-items";
const GCP_TIMESTAMP_KEY = "gcp-health-timestamp";

// ─── Region definitions ───────────────────────────────────────────────────────

export const AZURE_REGIONS: Array<{
  code: string;
  name: string;
  location: [number, number];
}> = [
  { code: "eastus", name: "East US", location: [-77.0369, 38.9072] },
  { code: "eastus2", name: "East US 2", location: [-82.9988, 39.9612] },
  { code: "westus", name: "West US", location: [-122.4194, 37.7749] },
  { code: "westus2", name: "West US 2", location: [-122.6784, 45.5155] },
  { code: "westus3", name: "West US 3", location: [-118.2437, 34.0522] },
  { code: "centralus", name: "Central US", location: [-93.625, 41.5909] },
  {
    code: "northcentralus",
    name: "North Central US",
    location: [-87.6298, 41.8781],
  },
  {
    code: "southcentralus",
    name: "South Central US",
    location: [-96.8089, 32.7767],
  },
  { code: "northeurope", name: "North Europe", location: [-6.2603, 53.3498] },
  { code: "westeurope", name: "West Europe", location: [4.8952, 52.3702] },
  { code: "eastasia", name: "East Asia", location: [114.1095, 22.3964] },
  {
    code: "southeastasia",
    name: "Southeast Asia",
    location: [103.8198, 1.3521],
  },
  { code: "japaneast", name: "Japan East", location: [139.6917, 35.6895] },
  { code: "japanwest", name: "Japan West", location: [130.3005, 33.5902] },
  {
    code: "australiaeast",
    name: "Australia East",
    location: [151.2093, -33.8688],
  },
  {
    code: "australiasoutheast",
    name: "Australia Southeast",
    location: [144.9631, -37.8136],
  },
  { code: "brazilsouth", name: "Brazil South", location: [-46.6333, -23.5505] },
  {
    code: "brazilsoutheast",
    name: "Brazil Southeast",
    location: [-43.1975, -22.9068],
  },
  {
    code: "indiacentral",
    name: "India Central",
    location: [72.8777, 19.076],
  },
  { code: "indiasouth", name: "India South", location: [79.0882, 20.9319] },
  { code: "ukwest", name: "UK West", location: [-4.4214, 53.4808] },
  { code: "uksouth", name: "UK South", location: [-0.1276, 51.5074] },
  { code: "chinanorth", name: "China North", location: [116.4074, 39.9042] },
  { code: "chinaeast", name: "China East", location: [121.4737, 31.2304] },
];

export const GCP_REGIONS: Array<{
  code: string;
  name: string;
  location: [number, number];
}> = [
  {
    code: "us-east1",
    name: "us-east1 (South Carolina)",
    location: [-80.9073, 33.7537],
  },
  {
    code: "us-east4",
    name: "us-east4 (N. Virginia)",
    location: [-77.4875, 38.9517],
  },
  {
    code: "us-west1",
    name: "us-west1 (Oregon)",
    location: [-122.6784, 45.5155],
  },
  {
    code: "us-west2",
    name: "us-west2 (Los Angeles)",
    location: [-118.2437, 34.0522],
  },
  {
    code: "us-west3",
    name: "us-west3 (Salt Lake City)",
    location: [-111.891, 40.7608],
  },
  {
    code: "us-west4",
    name: "us-west4 (Las Vegas)",
    location: [-115.1398, 36.1699],
  },
  {
    code: "us-central1",
    name: "us-central1 (Iowa)",
    location: [-93.625, 41.5909],
  },
  {
    code: "europe-west1",
    name: "europe-west1 (Belgium)",
    location: [4.4084, 50.901],
  },
  {
    code: "europe-west2",
    name: "europe-west2 (London)",
    location: [-0.1276, 51.5074],
  },
  {
    code: "europe-west3",
    name: "europe-west3 (Frankfurt)",
    location: [8.6821, 50.1109],
  },
  {
    code: "europe-west4",
    name: "europe-west4 (Netherlands)",
    location: [4.8952, 52.3702],
  },
  {
    code: "europe-north1",
    name: "europe-north1 (Finland)",
    location: [24.9384, 60.1699],
  },
  {
    code: "asia-east1",
    name: "asia-east1 (Taiwan)",
    location: [121.5654, 25.033],
  },
  {
    code: "asia-east2",
    name: "asia-east2 (Hong Kong)",
    location: [114.1095, 22.3964],
  },
  {
    code: "asia-northeast1",
    name: "asia-northeast1 (Tokyo)",
    location: [139.6917, 35.6895],
  },
  {
    code: "asia-northeast2",
    name: "asia-northeast2 (Osaka)",
    location: [135.5023, 34.6937],
  },
  {
    code: "asia-northeast3",
    name: "asia-northeast3 (Seoul)",
    location: [126.978, 37.5665],
  },
  {
    code: "asia-south1",
    name: "asia-south1 (Mumbai)",
    location: [72.8777, 19.076],
  },
  {
    code: "asia-south2",
    name: "asia-south2 (Delhi)",
    location: [77.1025, 28.7041],
  },
  {
    code: "asia-southeast1",
    name: "asia-southeast1 (Singapore)",
    location: [103.8198, 1.3521],
  },
  {
    code: "asia-southeast2",
    name: "asia-southeast2 (Jakarta)",
    location: [106.8456, -6.2088],
  },
  {
    code: "australia-southeast1",
    name: "australia-southeast1 (Sydney)",
    location: [151.2093, -33.8688],
  },
  {
    code: "australia-southeast2",
    name: "australia-southeast2 (Melbourne)",
    location: [144.9631, -37.8136],
  },
  {
    code: "southamerica-east1",
    name: "southamerica-east1 (São Paulo)",
    location: [-46.6333, -23.5505],
  },
  {
    code: "northamerica-northeast1",
    name: "northamerica-northeast1 (Montréal)",
    location: [-73.5673, 45.5017],
  },
  {
    code: "northamerica-northeast2",
    name: "northamerica-northeast2 (Toronto)",
    location: [-79.3832, 43.6532],
  },
];

export const OCI_REGIONS: Array<{
  code: string;
  name: string;
  location: [number, number];
}> = [
  { code: "us-ashburn-1", name: "US East (Ashburn)", location: [-77.4875, 38.9517] },
  { code: "us-phoenix-1", name: "US West (Phoenix)", location: [-112.074, 33.4484] },
  { code: "us-sanjose-1", name: "US West (San Jose)", location: [-121.8863, 37.3382] },
  { code: "us-chicago-1", name: "US Central (Chicago)", location: [-87.6298, 41.8781] },
  { code: "ca-montreal-1", name: "Canada Central (Montreal)", location: [-73.5673, 45.5017] },
  { code: "ca-toronto-1", name: "Canada Southeast (Toronto)", location: [-79.3832, 43.6532] },
  { code: "mx-queretaro-1", name: "Mexico Central (Querétaro)", location: [-100.3899, 20.5888] },
  { code: "mx-monterrey-1", name: "Mexico North (Monterrey)", location: [-100.3161, 25.6866] },
  { code: "sa-saopaulo-1", name: "Brazil Southeast (São Paulo)", location: [-46.6333, -23.5505] },
  { code: "sa-vinhedo-1", name: "Brazil Southeast (Vinhedo)", location: [-47.0486, -23.0396] },
  { code: "sa-santiago-1", name: "Chile Central (Santiago)", location: [-70.6693, -33.4489] },
  { code: "sa-bogota-1", name: "Colombia Central (Bogotá)", location: [-74.0721, 4.711] },
  { code: "uk-london-1", name: "UK South (London)", location: [-0.1276, 51.5074] },
  { code: "uk-cardiff-1", name: "UK West (Cardiff)", location: [-3.1791, 51.4816] },
  { code: "eu-frankfurt-1", name: "Germany Central (Frankfurt)", location: [8.6821, 50.1109] },
  { code: "eu-amsterdam-1", name: "Netherlands West (Amsterdam)", location: [4.8952, 52.3702] },
  { code: "eu-paris-1", name: "France Central (Paris)", location: [2.3522, 48.8566] },
  { code: "eu-marseille-1", name: "France South (Marseille)", location: [5.3698, 43.2965] },
  { code: "eu-milan-1", name: "Italy North (Milan)", location: [9.19, 45.4642] },
  { code: "eu-madrid-1", name: "Spain Central (Madrid)", location: [-3.7038, 40.4168] },
  { code: "eu-zurich-1", name: "Switzerland North (Zurich)", location: [8.5417, 47.3769] },
  { code: "eu-stockholm-1", name: "Sweden Central (Stockholm)", location: [18.0686, 59.3293] },
  { code: "eu-jovanovac-1", name: "Serbia Central (Jovanovac)", location: [21.268, 43.963] },
  { code: "ap-tokyo-1", name: "Japan East (Tokyo)", location: [139.6917, 35.6895] },
  { code: "ap-osaka-1", name: "Japan West (Osaka)", location: [135.5023, 34.6937] },
  { code: "ap-seoul-1", name: "South Korea Central (Seoul)", location: [126.978, 37.5665] },
  { code: "ap-chuncheon-1", name: "South Korea NE (Chuncheon)", location: [127.7295, 37.8813] },
  { code: "ap-mumbai-1", name: "India West (Mumbai)", location: [72.8777, 19.076] },
  { code: "ap-hyderabad-1", name: "India Central (Hyderabad)", location: [78.4867, 17.385] },
  { code: "ap-singapore-1", name: "Singapore", location: [103.8198, 1.3521] },
  { code: "ap-sydney-1", name: "Australia East (Sydney)", location: [151.2093, -33.8688] },
  { code: "ap-melbourne-1", name: "Australia Southeast (Melbourne)", location: [144.9631, -37.8136] },
  { code: "me-dubai-1", name: "UAE North (Dubai)", location: [55.2708, 25.2048] },
  { code: "me-abudhabi-1", name: "UAE Central (Abu Dhabi)", location: [54.3773, 24.4539] },
  { code: "me-jeddah-1", name: "Saudi Arabia West (Jeddah)", location: [39.1925, 21.5169] },
  { code: "il-jerusalem-1", name: "Israel Central (Jerusalem)", location: [35.2137, 31.7683] },
  { code: "af-johannesburg-1", name: "South Africa (Johannesburg)", location: [28.0473, -26.2041] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const determineStatus = (description: string): StatusType => {
  const lower = description.toLowerCase();
  if (
    lower.includes("outage") ||
    lower.includes("unavailable") ||
    lower.includes("down")
  )
    return "outage";
  if (
    lower.includes("degraded") ||
    lower.includes("issue") ||
    lower.includes("increased error") ||
    lower.includes("intermittent")
  )
    return "issue";
  return "operational";
};

const fetchWithCorsProxy = async (url: string): Promise<Response> => {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/rss+xml" },
      cache: "no-store",
    });
    if (response.ok) return response;
    throw new Error("Direct fetch failed");
  } catch {
    const proxyResponse = await fetch(
      `${CORS_PROXY}${encodeURIComponent(url)}`
    );
    if (!proxyResponse.ok) throw new Error("CORS proxy fetch failed");
    const data = await proxyResponse.json();
    return new Response(data.contents, {
      status: 200,
      headers: { "Content-Type": "application/rss+xml" },
    });
  }
};

const parseRSSItems = (
  text: string,
  provider: CloudProvider
): RSSItem[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");
  if (xmlDoc.querySelector("parsererror")) return [];
  return Array.from(xmlDoc.querySelectorAll("item")).map((item) => ({
    title: item.querySelector("title")?.textContent ?? "",
    description: item.querySelector("description")?.textContent ?? "",
    pubDate: item.querySelector("pubDate")?.textContent ?? "",
    guid: item.querySelector("guid")?.textContent ?? crypto.randomUUID(),
    provider,
  }));
};

const getStoredItems = (storageKey: string): RSSItem[] => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [];
    const items: RSSItem[] = JSON.parse(stored);
    const cutoff = subDays(new Date(), 7);
    return items.filter((item) => new Date(item.pubDate) > cutoff);
  } catch {
    return [];
  }
};

const storeItems = (
  items: RSSItem[],
  storageKey: string,
  timestampKey: string
): void => {
  try {
    const cutoff = subDays(new Date(), 7);
    const filtered = items.filter((item) => new Date(item.pubDate) > cutoff);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    localStorage.setItem(timestampKey, new Date().toISOString());
  } catch {
    // localStorage may be unavailable (private browsing, storage full)
  }
};

const mergeItems = (
  newItems: RSSItem[],
  existingItems: RSSItem[]
): RSSItem[] => {
  const itemMap = new Map<string, RSSItem>();
  existingItems.forEach((item) => itemMap.set(item.guid, item));
  newItems.forEach((item) => itemMap.set(item.guid, item));
  return Array.from(itemMap.values()).sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
};

// ─── Azure ────────────────────────────────────────────────────────────────────

export const fetchAzureHealth = async (): Promise<CloudHealthResult | null> => {
  try {
    const response = await fetchWithCorsProxy(AZURE_RSS_URL);
    const text = await response.text();
    const newItems = parseRSSItems(text, "azure");
    const existing = getStoredItems(AZURE_STORAGE_KEY);
    const all = mergeItems(newItems, existing);
    storeItems(all, AZURE_STORAGE_KEY, AZURE_TIMESTAMP_KEY);

    // Apply status based on RSS items to affected regions
    const regionStatusMap = new Map<string, StatusType>();
    all.forEach((item) => {
      // Azure RSS titles often include region names; do a best-effort match
      AZURE_REGIONS.forEach((region) => {
        if (
          item.title.toLowerCase().includes(region.name.toLowerCase()) ||
          item.title.toLowerCase().includes(region.code.toLowerCase())
        ) {
          const status = determineStatus(item.description + " " + item.title);
          const existing = regionStatusMap.get(region.code);
          if (
            !existing ||
            status === "outage" ||
            (status === "issue" && existing === "operational")
          ) {
            regionStatusMap.set(region.code, status);
          }
        }
      });
    });

    const regions: RegionStatus[] = AZURE_REGIONS.map((r) => ({
      ...r,
      status: regionStatusMap.get(r.code) ?? "operational",
      provider: "azure",
    }));

    return { regions, recentItems: all.slice(0, 50), lastBuildDate: new Date().toUTCString() };
  } catch (error) {
    console.error("Error fetching Azure health:", error);
    const cached = getStoredItems(AZURE_STORAGE_KEY);
    if (cached.length > 0) {
      return {
        regions: AZURE_REGIONS.map((r) => ({
          ...r,
          status: "operational",
          provider: "azure",
        })),
        recentItems: cached.slice(0, 50),
        lastBuildDate: null,
      };
    }
    return null;
  }
};

// ─── GCP ──────────────────────────────────────────────────────────────────────

export const fetchGCPHealth = async (): Promise<CloudHealthResult | null> => {
  try {
    const response = await fetchWithCorsProxy(GCP_API_URL);
    const text = await response.text();
    const newItems = parseRSSItems(text, "gcp");
    const existing = getStoredItems(GCP_STORAGE_KEY);
    const all = mergeItems(newItems, existing);
    storeItems(all, GCP_STORAGE_KEY, GCP_TIMESTAMP_KEY);

    const regionStatusMap = new Map<string, StatusType>();
    all.forEach((item) => {
      GCP_REGIONS.forEach((region) => {
        if (
          item.title.toLowerCase().includes(region.code.toLowerCase()) ||
          item.description.toLowerCase().includes(region.code.toLowerCase())
        ) {
          const status = determineStatus(item.description + " " + item.title);
          const existing = regionStatusMap.get(region.code);
          if (
            !existing ||
            status === "outage" ||
            (status === "issue" && existing === "operational")
          ) {
            regionStatusMap.set(region.code, status);
          }
        }
      });
    });

    const regions: RegionStatus[] = GCP_REGIONS.map((r) => ({
      ...r,
      status: regionStatusMap.get(r.code) ?? "operational",
      provider: "gcp",
    }));

    return { regions, recentItems: all.slice(0, 50), lastBuildDate: new Date().toUTCString() };
  } catch (error) {
    console.error("Error fetching GCP health:", error);
    const cached = getStoredItems(GCP_STORAGE_KEY);
    if (cached.length > 0) {
      return {
        regions: GCP_REGIONS.map((r) => ({
          ...r,
          status: "operational",
          provider: "gcp",
        })),
        recentItems: cached.slice(0, 50),
        lastBuildDate: null,
      };
    }
    return null;
  }
};

// ─── All providers ────────────────────────────────────────────────────────────

export type AllCloudHealthResult = {
  aws: CloudHealthResult | null;
  azure: CloudHealthResult | null;
  gcp: CloudHealthResult | null;
};

export const fetchAllCloudHealth = async (): Promise<AllCloudHealthResult> => {
  const [awsRaw, azure, gcp] = await Promise.all([
    fetchAWSHealth(),
    fetchAzureHealth(),
    fetchGCPHealth(),
  ]);

  // Normalize AWS result to CloudHealthResult (add provider field to regions)
  const aws: CloudHealthResult | null = awsRaw
    ? {
        regions: awsRaw.regions.map((r) => ({
          code: r.code,
          name: r.name,
          status: r.status,
          provider: "aws" as CloudProvider,
          location: r.location,
        })),
        recentItems: awsRaw.recentItems as RSSItem[],
        lastBuildDate: awsRaw.lastBuildDate,
      }
    : null;

  return { aws, azure, gcp };
};

// ─── Last-update helpers ──────────────────────────────────────────────────────

export { getAWSLastUpdateTime };
export const getAzureLastUpdateTime = (): string | null =>
  localStorage.getItem(AZURE_TIMESTAMP_KEY);
export const getGCPLastUpdateTime = (): string | null =>
  localStorage.getItem(GCP_TIMESTAMP_KEY);
export const getOCILastUpdateTime = (): string | null =>
  localStorage.getItem("oci-health-timestamp");
