
import { Card } from "@/components/ui/card";
import type { RegionStatus } from "@/lib/cloud-health";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface RegionSummaryProps {
  regions: RegionStatus[];
}

const RegionSummary = ({ regions }: RegionSummaryProps) => {
  const operational = regions.filter((r) => r.status === "operational").length;
  const issues = regions.filter((r) => r.status === "issue").length;
  const outages = regions.filter((r) => r.status === "outage").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4 flex items-center space-x-4 dark:bg-gray-800 dark:border-gray-700">
        <CheckCircle className="w-8 h-8 text-emerald-500" />
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Operational</p>
          <p className="text-2xl font-semibold dark:text-gray-100">{operational}</p>
        </div>
      </Card>
      <Card className="p-4 flex items-center space-x-4 dark:bg-gray-800 dark:border-gray-700">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Issues</p>
          <p className="text-2xl font-semibold dark:text-gray-100">{issues}</p>
        </div>
      </Card>
      <Card className="p-4 flex items-center space-x-4 dark:bg-gray-800 dark:border-gray-700">
        <XCircle className="w-8 h-8 text-red-500" />
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Outages</p>
          <p className="text-2xl font-semibold dark:text-gray-100">{outages}</p>
        </div>
      </Card>
    </div>
  );
};

export default RegionSummary;
