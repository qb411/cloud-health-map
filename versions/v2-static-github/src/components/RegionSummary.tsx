
import { Card } from "@/components/ui/card";
import { type AWSRegion } from "@/lib/aws-regions";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface RegionSummaryProps {
  regions: AWSRegion[];
}

const RegionSummary = ({ regions }: RegionSummaryProps) => {
  const operational = regions.filter((r) => r.status === "operational").length;
  const issues = regions.filter((r) => r.status === "issue").length;
  const outages = regions.filter((r) => r.status === "outage").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4 flex items-center space-x-4">
        <CheckCircle className="w-8 h-8 text-emerald-500" />
        <div>
          <p className="text-sm text-gray-500">Operational</p>
          <p className="text-2xl font-semibold">{operational}</p>
        </div>
      </Card>
      <Card className="p-4 flex items-center space-x-4">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <div>
          <p className="text-sm text-gray-500">Issues</p>
          <p className="text-2xl font-semibold">{issues}</p>
        </div>
      </Card>
      <Card className="p-4 flex items-center space-x-4">
        <XCircle className="w-8 h-8 text-red-500" />
        <div>
          <p className="text-sm text-gray-500">Outages</p>
          <p className="text-2xl font-semibold">{outages}</p>
        </div>
      </Card>
    </div>
  );
};

export default RegionSummary;
