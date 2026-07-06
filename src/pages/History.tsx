import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { format, isToday, isYesterday } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { getAllRecentEvents } from "@/lib/event-store";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import type { RSSItem, CloudProvider } from "@/lib/cloud-health";

// ─── Provider badge ───────────────────────────────────────────────────────────

const PROVIDER_BADGE: Record<
  CloudProvider,
  { label: string; className: string }
> = {
  aws: {
    label: "AWS",
    className:
      "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700",
  },
  azure: {
    label: "Azure",
    className:
      "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700",
  },
  gcp: {
    label: "GCP",
    className:
      "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700",
  },
  oci: {
    label: "OCI",
    className:
      "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700",
  },
};

// ─── Status color ─────────────────────────────────────────────────────────────

const getStatusBackground = (title: string): string => {
  const lower = title.toLowerCase();
  if (lower.includes("outage"))
    return "bg-red-50 dark:bg-red-950/30 border-l-4 border-red-400 dark:border-red-600";
  if (lower.includes("issue") || lower.includes("degraded"))
    return "bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 dark:border-amber-600";
  if (lower.includes("operational") || lower.includes("recovery"))
    return "bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-400 dark:border-emerald-600";
  return "bg-white dark:bg-gray-800 border-l-4 border-gray-200 dark:border-gray-600";
};

// ─── Component ────────────────────────────────────────────────────────────────

const History = () => {
  const [events, setEvents] = useState<RSSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProvider, setFilterProvider] = useState<CloudProvider | "all">("all");

  useEffect(() => {
    const fetchAll = async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      // Fetch all events up to 365 days back
      const items = await getAllRecentEvents(365, 1000);
      setEvents(items);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Filter by provider
  const filteredEvents =
    filterProvider === "all"
      ? events
      : events.filter((e) => e.provider === filterProvider);

  // Group by date
  const dateGroups: { label: string; events: RSSItem[] }[] = [];
  const dateMap = new Map<string, RSSItem[]>();

  for (const event of filteredEvents) {
    const date = new Date(event.pubDate);
    let label: string;
    if (isToday(date)) {
      label = "Today";
    } else if (isYesterday(date)) {
      label = "Yesterday";
    } else {
      label = format(date, "MMM d, yyyy");
    }
    if (!dateMap.has(label)) {
      dateMap.set(label, []);
    }
    dateMap.get(label)!.push(event);
  }
  for (const [label, items] of dateMap) {
    dateGroups.push({ label, events: items });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Event History
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              All recorded cloud health events (up to 1 year)
            </p>
          </div>

          {/* Provider filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(["all", "aws", "azure", "gcp", "oci"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilterProvider(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterProvider === p
                    ? p === "all"
                      ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900"
                      : p === "aws"
                        ? "bg-orange-500 text-white"
                        : p === "azure"
                          ? "bg-blue-600 text-white"
                          : p === "gcp"
                            ? "bg-green-600 text-white"
                            : "bg-red-700 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {p === "all" ? "All" : p.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading events...
            </p>
          )}

          {/* Empty state */}
          {!loading && filteredEvents.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No events found{filterProvider !== "all" ? ` for ${filterProvider.toUpperCase()}` : ""}.
            </p>
          )}

          {/* Event list grouped by date */}
          <div className="space-y-6">
            {dateGroups.map((group) => (
              <div key={group.label}>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-3">
                  {group.label}
                </h3>
                <div className="space-y-3">
                  {group.events.map((event, idx) => {
                    const badge =
                      PROVIDER_BADGE[event.provider] ?? PROVIDER_BADGE.aws;
                    let parsedDate: Date | null = null;
                    try {
                      parsedDate = new Date(event.pubDate);
                      if (isNaN(parsedDate.getTime())) parsedDate = null;
                    } catch {
                      // leave null
                    }

                    return (
                      <div
                        key={event.guid ?? idx}
                        className={`rounded-lg p-4 ${getStatusBackground(event.title)}`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {event.title}
                            </h3>
                          </div>
                          {parsedDate && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
                              {format(parsedDate, "MMM d, yyyy HH:mm")}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {!loading && filteredEvents.length > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 text-center">
              Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default History;
