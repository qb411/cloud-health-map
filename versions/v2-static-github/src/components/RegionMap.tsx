
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type AWSRegion } from "@/lib/aws-regions";
import { Card } from "@/components/ui/card";

// Helper function to get country flag image
const getCountryFlag = (regionName: string): string => {
  // Map AWS regions to their corresponding country codes for flagcdn.com
  const countryMap: { [key: string]: string } = {
    'Africa (Cape Town)': 'za',
    'Asia Pacific (Hong Kong)': 'hk',
    'Asia Pacific (Tokyo)': 'jp',
    'Asia Pacific (Seoul)': 'kr',
    'Asia Pacific (Osaka)': 'jp',
    'Asia Pacific (Mumbai)': 'in',
    'Asia Pacific (Hyderabad)': 'in',
    'Asia Pacific (Singapore)': 'sg',
    'Asia Pacific (Sydney)': 'au',
    'Asia Pacific (Jakarta)': 'id',
    'Asia Pacific (Melbourne)': 'au',
    'Asia Pacific (Thailand)': 'th',
    'Asia Pacific (Malaysia)': 'my',
    'Canada (Central)': 'ca',
    'Canada (Calgary)': 'ca',
    'China (Beijing)': 'cn',
    'China (Ningxia)': 'cn',
    'Europe (Frankfurt)': 'de',
    'Europe (Zurich)': 'ch',
    'Europe (Stockholm)': 'se',
    'Europe (Milan)': 'it',
    'Europe (Spain)': 'es',
    'Europe (Ireland)': 'ie',
    'Europe (London)': 'gb',
    'Europe (Paris)': 'fr',
    'Israel (Tel Aviv)': 'il',
    'Middle East (UAE)': 'ae',
    'Middle East (Bahrain)': 'bh',
    'Mexico (Central)': 'mx',
    'South America (São Paulo)': 'br',
    'US East (N. Virginia)': 'us',
    'US East (Ohio)': 'us',
    'US West (N. California)': 'us',
    'US West (Oregon)': 'us',
  };

  const countryCode = countryMap[regionName] || 'un';
  return `<img src="https://flagcdn.com/16x12/${countryCode}.png" alt="${countryCode}" class="inline-block mr-1" style="vertical-align: middle;">`;
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
        background: white !important;
        border-radius: 12px !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
        border: 1px solid #e5e7eb !important;
        padding: 0 !important;
      }
      .leaflet-popup-tip {
        background: white !important;
        border: 1px solid #e5e7eb !important;
      }
      .leaflet-popup-content {
        margin: 0 !important;
        padding: 0 !important;
      }
      .aws-popup-header {
        background: linear-gradient(135deg, #ff9900 0%, #ff7700 100%);
        color: white;
        padding: 8px 12px;
        border-radius: 12px 12px 0 0;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .aws-popup-body {
        padding: 12px;
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
        <div class="aws-popup-header">
          <span>AWS Region</span>
        </div>
        <div class="aws-popup-body">
          <h3 class="font-semibold text-gray-900 leading-tight">${getCountryFlag(region.name)}${region.name}</h3>
          <p class="text-xs text-gray-500 mt-1">${region.code}</p>
          <div class="flex items-center gap-2 mt-3">
            <div class="w-2 h-2 rounded-full ${region.status === 'operational' ? 'bg-emerald-500' : region.status === 'issue' ? 'bg-amber-500' : 'bg-red-500'}"></div>
            <p class="text-sm font-medium ${getStatusTextColor(region.status)}">
              ${region.status.charAt(0).toUpperCase() + region.status.slice(1)}
            </p>
          </div>
        </div>
      `, {
        className: 'aws-region-popup'
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
