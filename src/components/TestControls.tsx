
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [isOpen, setIsOpen] = useState(false);

  const handleSimulate = () => {
    if (selectedRegion) {
      onSimulateIssue(selectedRegion, selectedStatus);
      setIsOpen(false); // Close the dropdown after simulation
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
        >
          <BeakerIcon className="h-4 w-4" />
          Test Controls
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-2 z-[100]" align="end">
        <DropdownMenuLabel>Simulate AWS Issue</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2 space-y-4">
          <Select
            value={selectedRegion}
            onValueChange={setSelectedRegion}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent className="z-[101]">
              {regions.map((region) => (
                <SelectItem key={region.code} value={region.code}>
                  {region.name} ({region.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedStatus}
            onValueChange={(value: "issue" | "outage") => setSelectedStatus(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="z-[101]">
              <SelectItem value="issue">Issue (Yellow)</SelectItem>
              <SelectItem value="outage">Outage (Red)</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleSimulate} 
            disabled={!selectedRegion}
            className="w-full"
          >
            Apply Simulation
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TestControls;
