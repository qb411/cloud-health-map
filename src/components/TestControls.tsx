import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
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
import type { RegionStatus, CloudProvider } from "@/lib/cloud-health";

interface TestControlsProps {
  /** All regions across ALL providers */
  allRegions: RegionStatus[];
  /** Currently selected provider from parent — used to filter regions */
  selectedProvider: CloudProvider;
  onSimulateIssue: (regionCode: string, status: "issue" | "outage", provider: CloudProvider) => void;
}

const TestControls = ({ allRegions, selectedProvider, onSimulateIssue }: TestControlsProps) => {
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<"issue" | "outage">("issue");
  const [isOpen, setIsOpen] = useState(false);

  // Filter to regions matching the parent's selected provider
  const providerRegions = allRegions.filter((r) => r.provider === selectedProvider);

  const handleSimulate = () => {
    if (!selectedRegion) return;
    onSimulateIssue(selectedRegion, selectedStatus, selectedProvider);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BeakerIcon className="h-4 w-4" />
          Test Controls
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72 p-2 z-[9999]" align="end">
        <DropdownMenuLabel>Simulate Incident for {selectedProvider.toUpperCase()}</DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="p-2 space-y-3">
          {/* Region selector */}
          <div>
            <p className="text-xs text-gray-500 mb-1">
              Region ({providerRegions.length} available)
            </p>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select region…" />
              </SelectTrigger>
              <SelectContent className="z-[10000] max-h-64">
                {providerRegions.map((region) => (
                  <SelectItem key={region.code} value={region.code}>
                    {region.name}
                    <span className="ml-1 text-gray-400 text-xs">({region.code})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status selector */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Simulate as</p>
            <Select
              value={selectedStatus}
              onValueChange={(v: "issue" | "outage") => setSelectedStatus(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                <SelectItem value="issue">⚠ Issue (amber)</SelectItem>
                <SelectItem value="outage">🔴 Outage (red)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSimulate}
            disabled={!selectedRegion}
            className="w-full"
            size="sm"
          >
            Apply Simulation
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TestControls;
