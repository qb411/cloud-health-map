import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import type { RSSItem, CloudProvider } from "@/lib/cloud-health";

interface StatusLogProps {
  items: RSSItem[];
  lastBuildDate?: string | null;
}

// ─── Provider badge ───────────────────────────────────────────────────────────

const PROVIDER_BADGE: Record<
  CloudProvider,
  { label: string; className: string }
> = {
  aws: {
    label: "AWS",
    className: "bg-orange-100 text-orange-800 border border-orange-200",
  },
  azure: {
    label: "Azure",
    className: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  gcp: {
    label: "GCP",
    className: "bg-green-100 text-green-800 border border-green-200",
  },
};

// ─── Status color ─────────────────────────────────────────────────────────────

const getStatusBackground = (title: string): string => {
  const lower = title.toLowerCase();
  if (lower.includes("outage")) return "bg-red-50 border-l-4 border-red-400";
  if (lower.includes("issue") || lower.includes("degraded"))
    return "bg-amber-50 border-l-4 border-amber-400";
  if (lower.includes("operational") || lower.includes("recovery"))
    return "bg-emerald-50 border-l-4 border-emerald-400";
  return "bg-white border-l-4 border-gray-200";
};

// ─── Component ────────────────────────────────────────────────────────────────

const StatusLog = ({ items, lastBuildDate }: StatusLogProps) => {
  const feedUpdateTime = lastBuildDate ? new Date(lastBuildDate) : null;

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Recent Status Updates</h2>
        {feedUpdateTime && (
          <p className="text-sm text-gray-500 mt-1">
            Last RSS Update:{" "}
            {format(feedUpdateTime, "MMM d, yyyy HH:mm:ss")}
          </p>
        )}
        {items.length === 0 && (
          <p className="text-sm text-gray-400 mt-2">
            No events in the last 7 days — all systems operational.
          </p>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const badge = PROVIDER_BADGE[item.provider] ?? PROVIDER_BADGE.aws;
          let parsedDate: Date | null = null;
          try {
            parsedDate = new Date(item.pubDate);
          } catch {
            // leave null
          }

          return (
            <div
              key={item.guid ?? index}
              className={`rounded-lg p-4 ${getStatusBackground(item.title)}`}
            >
              <div className="flex justify-between items-start gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <h3 className="font-medium text-gray-900 text-sm">
                    {item.title}
                  </h3>
                </div>
                {parsedDate && !isNaN(parsedDate.getTime()) && (
                  <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                    {format(parsedDate, "MMM d, yyyy HH:mm")}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default StatusLog;
