import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { format, isToday, isYesterday } from "date-fns";
import type { RSSItem, CloudProvider } from "@/lib/cloud-health";

interface StatusLogProps {
  items: RSSItem[];
  lastBuildDate?: string | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface IncidentGroup {
  regionCode: string;
  latestEvent: RSSItem;
  allEvents: RSSItem[];
  count: number;
}

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

// ─── Region extraction ────────────────────────────────────────────────────────

function extractRegionCode(item: RSSItem): string {
  const text = `${item.title} ${item.guid}`.toLowerCase();
  // AWS pattern: us-east-1, eu-west-2, ap-southeast-1, me-south-1, me-central-1
  const awsMatch = text.match(/([a-z]{2}-[a-z]+-\d)/);
  if (awsMatch) return awsMatch[1];
  // Azure pattern: eastus, westeurope, southeastasia
  const azurePatterns = [
    "eastus",
    "westus",
    "westeurope",
    "northeurope",
    "southeastasia",
    "eastasia",
    "japaneast",
    "australiaeast",
  ];
  for (const p of azurePatterns) {
    if (text.includes(p)) return p;
  }
  // Fallback: use the guid or a hash of the title
  return item.guid?.split("/").pop() || "unknown";
}

// ─── Grouping logic ───────────────────────────────────────────────────────────

function groupEvents(
  items: RSSItem[]
): { date: string; groups: IncidentGroup[] }[] {
  // Step 1: Parse dates and sort newest first
  const withDates = items
    .map((item) => ({
      item,
      date: new Date(item.pubDate),
      region: extractRegionCode(item),
    }))
    .filter((x) => !isNaN(x.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  // Step 2: Group by region + 24h window
  const incidentGroups: { region: string; events: RSSItem[]; latest: Date }[] =
    [];

  for (const entry of withDates) {
    const existing = incidentGroups.find(
      (g) =>
        g.region === entry.region &&
        Math.abs(g.latest.getTime() - entry.date.getTime()) <
          24 * 60 * 60 * 1000
    );
    if (existing) {
      existing.events.push(entry.item);
    } else {
      incidentGroups.push({
        region: entry.region,
        events: [entry.item],
        latest: entry.date,
      });
    }
  }

  // Step 3: Build IncidentGroup objects
  const groups: (IncidentGroup & { latestDate: Date })[] = incidentGroups.map(
    (g) => ({
      regionCode: g.region,
      latestEvent: g.events[0],
      allEvents: g.events,
      count: g.events.length,
      latestDate: g.latest,
    })
  );

  // Step 4: Organize into date sections
  const dateMap = new Map<string, IncidentGroup[]>();

  for (const group of groups) {
    let dateLabel: string;
    if (isToday(group.latestDate)) {
      dateLabel = "Today";
    } else if (isYesterday(group.latestDate)) {
      dateLabel = "Yesterday";
    } else {
      dateLabel = format(group.latestDate, "MMM d, yyyy");
    }

    if (!dateMap.has(dateLabel)) {
      dateMap.set(dateLabel, []);
    }
    dateMap.get(dateLabel)!.push(group);
  }

  // Maintain order (newest first)
  const result: { date: string; groups: IncidentGroup[] }[] = [];
  for (const [date, dateGroups] of dateMap) {
    result.push({ date, groups: dateGroups });
  }

  return result;
}

// ─── Truncated description component ─────────────────────────────────────────

function TruncatedDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > 150;

  if (!needsTruncation) {
    return (
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        {text}
      </p>
    );
  }

  return (
    <div>
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        {expanded ? text : `${text.slice(0, 150)}...`}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({
  item,
  compact = false,
}: {
  item: RSSItem;
  compact?: boolean;
}) {
  const badge = PROVIDER_BADGE[item.provider] ?? PROVIDER_BADGE.aws;
  let parsedDate: Date | null = null;
  try {
    parsedDate = new Date(item.pubDate);
    if (isNaN(parsedDate.getTime())) parsedDate = null;
  } catch {
    // leave null
  }

  const padding = compact ? "p-3" : "p-4";
  const titleSize = compact ? "text-xs" : "text-sm";

  return (
    <div
      className={`rounded-lg ${padding} ${getStatusBackground(item.title)}`}
    >
      <div className="flex justify-between items-start gap-2 mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}
          >
            {badge.label}
          </span>
          <h3
            className={`font-medium text-gray-900 dark:text-gray-100 ${titleSize}`}
          >
            {item.title}
          </h3>
        </div>
        {parsedDate && (
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
            {format(parsedDate, "MMM d, yyyy HH:mm")}
          </span>
        )}
      </div>
      <TruncatedDescription text={item.description} />
    </div>
  );
}

// ─── Incident group component ─────────────────────────────────────────────────

function IncidentGroupCard({ group }: { group: IncidentGroup }) {
  const [expanded, setExpanded] = useState(false);
  const previousUpdates = group.allEvents.slice(1);

  return (
    <div className="space-y-1">
      <EventCard item={group.latestEvent} />
      {previousUpdates.length > 0 && (
        <div className="ml-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:underline py-1"
          >
            {expanded
              ? "Hide previous updates"
              : `${previousUpdates.length} previous update${previousUpdates.length > 1 ? "s" : ""}`}
          </button>
          {expanded && (
            <div className="space-y-1 mt-1">
              {previousUpdates.map((item, idx) => (
                <EventCard
                  key={item.guid ?? idx}
                  item={item}
                  compact={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const StatusLog = ({ items, lastBuildDate }: StatusLogProps) => {
  const [visibleCount, setVisibleCount] = useState(10);
  const feedUpdateTime = lastBuildDate ? new Date(lastBuildDate) : null;

  const dateSections = groupEvents(items);

  // Flatten all groups to apply the limit
  const allGroups = dateSections.flatMap((section) =>
    section.groups.map((group) => ({ date: section.date, group }))
  );
  const totalCount = allGroups.length;
  const visibleGroups = allGroups.slice(0, visibleCount);

  // Re-organize visible groups back into date sections for rendering
  const visibleSections: { date: string; groups: IncidentGroup[] }[] = [];
  for (const { date, group } of visibleGroups) {
    const existing = visibleSections.find((s) => s.date === date);
    if (existing) {
      existing.groups.push(group);
    } else {
      visibleSections.push({ date, groups: [group] });
    }
  }

  return (
    <Card className="p-6 dark:bg-gray-800">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Recent Status Updates
        </h2>
        {feedUpdateTime && !isNaN(feedUpdateTime.getTime()) && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last RSS Update:{" "}
            {format(feedUpdateTime, "MMM d, yyyy HH:mm:ss")}
          </p>
        )}
        {items.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            No events in the last 7 days — all systems operational.
          </p>
        )}
      </div>

      <div className="space-y-6">
        {visibleSections.map((section) => (
          <div key={section.date}>
            {/* Date section header */}
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-3">
              {section.date}
            </h3>
            <div className="space-y-3">
              {section.groups.map((group, idx) => (
                <IncidentGroupCard
                  key={`${group.regionCode}-${group.latestEvent.guid ?? idx}`}
                  group={group}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {/* Pagination */}
      {totalCount > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing {Math.min(visibleCount, totalCount)} of {totalCount}{" "}
            incidents
          </span>
          {visibleCount < totalCount && (
            <button
              onClick={() => setVisibleCount((c) => c + 10)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Show more
            </button>
          )}
        </div>
      )}

      {/* Link to full history */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <Link
          to="/history"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          View full event history →
        </Link>
      </div>
    </Card>
  );
};

export default StatusLog;
