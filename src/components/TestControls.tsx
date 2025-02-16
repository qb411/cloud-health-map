
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { BeakerIcon } from "lucide-react";
import type { AWSRegion } from "@/lib/aws-regions";

interface TestControlsProps {
  regions: AWSRegion[];
  onSimulateIssue: (regionCode: string, status: "issue" | "outage") => void;
}

const TestControls = ({ regions, onSimulateIssue }: TestControlsProps) => {
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<"issue" | "outage">("issue");

  const handleSimulate = () => {
    if (selectedRegion) {
      onSimulateIssue(selectedRegion, selectedStatus);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
        >
          <BeakerIcon className="h-4 w-4" />
          Test Controls
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Simulate AWS Region Issue</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Select
              value={selectedRegion}
              onValueChange={setSelectedRegion}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.code} value={region.code}>
                    {region.name} ({region.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Select
              value={selectedStatus}
              onValueChange={(value: "issue" | "outage") => setSelectedStatus(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="issue">Issue (Yellow)</SelectItem>
                <SelectItem value="outage">Outage (Red)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleSimulate} 
            disabled={!selectedRegion}
            className="w-full"
          >
            Simulate Issue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestControls;
