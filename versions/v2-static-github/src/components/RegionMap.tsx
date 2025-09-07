
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type AWSRegion } from "@/lib/aws-regions";
import { Card } from "@/components/ui/card";

// Helper function to get country flag emoji
const getCountryFlag = (regionName: string): string => {
  // Map AWS regions to their corresponding country codes
  const countryMap: { [key: string]: string } = {
    'Africa (Cape Town)': '🇿🇦',
    'Asia Pacific (Hong Kong)': '🇭🇰',
    'Asia Pacific (Tokyo)': '🇯🇵',
    'Asia Pacific (Seoul)': '🇰🇷',
    'Asia Pacific (Osaka)': '🇯🇵',
    'Asia Pacific (Mumbai)': '🇮🇳',
    'Asia Pacific (Hyderabad)': '🇮🇳',
    'Asia Pacific (Singapore)': '🇸🇬',
    'Asia Pacific (Sydney)': '🇦🇺',
    'Asia Pacific (Jakarta)': '🇮🇩',
    'Asia Pacific (Melbourne)': '🇦🇺',
    'Asia Pacific (Thailand)': '🇹🇭',
    'Asia Pacific (Malaysia)': '🇲🇾',
    'Canada (Central)': '🇨🇦',
    'Canada (Calgary)': '🇨🇦',
    'China (Beijing)': '🇨🇳',
    'China (Ningxia)': '🇨🇳',
    'Europe (Frankfurt)': '🇩🇪',
    'Europe (Zurich)': '🇨🇭',
    'Europe (Stockholm)': '🇸🇪',
    'Europe (Milan)': '🇮🇹',
    'Europe (Spain)': '🇪🇸',
    'Europe (Ireland)': '🇮🇪',
    'Europe (London)': '🇬🇧',
    'Europe (Paris)': '🇫🇷',
    'Israel (Tel Aviv)': '🇮🇱',
    'Middle East (UAE)': '🇦🇪',
    'Middle East (Bahrain)': '🇧🇭',
    'Mexico (Central)': '🇲🇽',
    'South America (São Paulo)': '🇧🇷',
    'US East (N. Virginia)': '🇺🇸',
    'US East (Ohio)': '🇺🇸',
    'US West (N. California)': '🇺🇸',
    'US West (Oregon)': '🇺🇸',
  };

  return countryMap[regionName] || '🏳️';
};

// Helper function to get marker color based on status
const getStatusColor = (status: "operational" | "issue" | "outage") => {
  switch (status) {
    case "operational":
      return { fill: '#10B981', border: '#059669' }; // Green
    case "issue":
      return { fill: '#F59E0B', border: '#D97706' }; // Yellow/Orange
    case "outage":
      return { fill: '#EF4444', border: '#DC2626' }; // Red
    default:
      return { fill: '#10B981', border: '#059669' }; // Default to green
  }
};

// Helper function to get status text color
const getStatusTextColor = (status: "operational" | "issue" | "outage") => {
  switch (status) {
    case "operational":
      return "text-emerald-600";
    case "issue":
      return "text-amber-600";
    case "outage":
      return "text-red-600";
    default:
      return "text-emerald-600";
  }
};

interface RegionMapProps {
  regions: AWSRegion[];
}

const RegionMap = ({ regions }: RegionMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with options to limit scroll/zoom
    map.current = L.map(mapContainer.current, {
      minZoom: 1.5,
      maxZoom: 8,
      maxBounds: L.latLngBounds(
        L.latLng(-60, -180),
        L.latLng(75, 180)
      ),
      maxBoundsViscosity: 1.0,
    }).setView([20, 0], 2);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
      noWrap: true,
      bounds: L.latLngBounds(
        L.latLng(-60, -180),
        L.latLng(75, 180)
      )
    }).addTo(map.current);

    // Add CSS to style the popup globally
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-popup-content-wrapper {
        background: #FFE5D4 !important;
        border-radius: 8px;
      }
      .leaflet-popup-tip {
        background: #FFE5D4 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      map.current?.remove();
      document.head.removeChild(style);
    };
  }, []);

  // Update markers when regions data changes
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers for each AWS region
    regions.forEach((region) => {
      const colors = getStatusColor(region.status);
      const marker = L.circleMarker([region.location[1], region.location[0]], {
        radius: 8,
        fillColor: colors.fill,
        color: colors.border,
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map.current!);

      // Add popup with region info
      marker.bindPopup(`
        <div class="pt-1 px-1 pb-0.5">
          <h3 class="font-semibold leading-none">${getCountryFlag(region.name)} ${region.name}</h3>
          <p class="text-sm text-gray-500 -mt-1 leading-none">${region.code}</p>
          <p class="text-sm font-medium ${getStatusTextColor(region.status)} mt-1.5 mb-0 leading-none">
            ${region.status.charAt(0).toUpperCase() + region.status.slice(1)}
          </p>
        </div>
      `, {
        className: 'compact-popup'
      });

      // Add hover effect
      marker.on('mouseover', function() {
        this.setStyle({
          fillOpacity: 1,
          radius: 10
        });
      });

      marker.on('mouseout', function() {
        this.setStyle({
          fillOpacity: 0.8,
          radius: 8
        });
      });

      markersRef.current.push(marker);
    });
  }, [regions]);

  return (
    <Card className="relative w-full h-[600px] overflow-hidden rounded-lg shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
    </Card>
  );
};

export default RegionMap;
