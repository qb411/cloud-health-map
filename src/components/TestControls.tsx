
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
import type { RegionStatus } from "@/lib/cloud-health";

interface TestControlsProps {
  regions: RegionStatus[];
  onSimulateIssue: (regionCode: string, status: "issue" | "outage") => void;
}

const TestControls = ({ regions, onSimulateIssue }: TestControlsProps) => {
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<"issue" | "outage">("issue");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("aws");

  const handleSimulate = () => {
    if (selectedRegion) {
      onSimulateIssue(selectedRegion, selectedStatus);
      setIsOpen(false); // Close the dropdown after simulation
    }
  };

  // Filter regions by selected provider
  const providerRegions = regions.filter(r => r.provider === selectedProvider);

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'aws': return 'AWS';
      case 'azure': return 'Azure';
      case 'gcp': return 'GCP';
      default: return 'AWS';
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
      <DropdownMenuContent className="w-64 p-2 z-[9999]" align="end">
        <DropdownMenuLabel>Select Provider</DropdownMenuLabel>
        <div className="flex gap-1 p-2">
          {['aws', 'azure', 'gcp'].map((provider) => (
            <button
              key={provider}
              onClick={() => {
                setSelectedProvider(provider);
                setSelectedRegion("");
              }}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedProvider === provider
                  ? provider === 'aws' ? 'bg-orange-500 text-white'
                  : provider === 'azure' ? 'bg-blue-600 text-white'
                  : 'bg-blue-400 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {getProviderLabel(provider)}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <div className="p-2 space-y-4">
          <Select
            value={selectedRegion}
            onValueChange={setSelectedRegion}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent className="z-[10000]">
              {providerRegions.map((region) => (
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
            <SelectContent className="z-[10000]">
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
