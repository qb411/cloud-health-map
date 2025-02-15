
import { Card } from "@/components/ui/card";
import { awsRegions } from "@/lib/aws-regions";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const RegionSummary = () => {
  const operational = awsRegions.filter((r) => r.status === "operational").length;
  const issues = awsRegions.filter((r) => r.status === "issue").length;
  const outages = awsRegions.filter((r) => r.status === "outage").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4 flex items-center space-x-4">
        <CheckCircle className="w-8 h-8 text-status-success" />
        <div>
          <p className="text-sm text-gray-500">Operational</p>
          <p className="text-2xl font-semibold">{operational}</p>
        </div>
      </Card>
      <Card className="p-4 flex items-center space-x-4">
        <AlertTriangle className="w-8 h-8 text-status-warning" />
        <div>
          <p className="text-sm text-gray-500">Issues</p>
          <p className="text-2xl font-semibold">{issues}</p>
        </div>
      </Card>
      <Card className="p-4 flex items-center space-x-4">
        <XCircle className="w-8 h-8 text-status-critical" />
        <div>
          <p className="text-sm text-gray-500">Outages</p>
          <p className="text-2xl font-semibold">{outages}</p>
        </div>
      </Card>
    </div>
  );
};

export default RegionSummary;
