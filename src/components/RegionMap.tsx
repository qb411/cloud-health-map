import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useTheme } from "next-themes";
import type { RegionStatus } from "@/lib/cloud-health";
import { Card } from "@/components/ui/card";

// ─── Tile configurations ──────────────────────────────────────────────────────
// Light mode: CARTO Positron (clean, no labels)
// Dark mode: CARTO Dark Matter (no labels) — our markers ARE the data

const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
} as const;

const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

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

interface RegionMapProps {
  regions: RegionStatus[];
  eventCounts?: Record<string, number>; // regionCode -> count of active incidents
  className?: string; // Override card height/styling (e.g., NOC mode)
}

const RegionMap = ({ regions, eventCounts = {}, className }: RegionMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { resolvedTheme } = useTheme();

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

    // Add CSS to style the popup and map controls
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-container {
        background-color: #f8fafc !important;
      }
      .dark .leaflet-container {
        background-color: #111827 !important;
      }
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
      .dark .leaflet-popup-content-wrapper {
        background: #1f2937 !important;
        border-color: #374151 !important;
      }
      .dark .leaflet-popup-tip {
        background: #1f2937 !important;
        border-color: #374151 !important;
      }
      /* Dark mode for Leaflet controls */
      .dark .leaflet-control-zoom a {
        background-color: #1f2937 !important;
        color: #e5e7eb !important;
        border-color: #374151 !important;
      }
      .dark .leaflet-control-zoom a:hover {
        background-color: #374151 !important;
      }
      .dark .leaflet-control-attribution {
        background-color: rgba(17, 24, 39, 0.8) !important;
        color: #9ca3af !important;
      }
      .dark .leaflet-control-attribution a {
        color: #60a5fa !important;
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
        padding: 8px 12px;
        text-align: center;
        color: #111827;
      }
      .dark .aws-popup-body {
        color: #e5e7eb;
      }
      .custom-cluster-icon, .custom-region-icon {
        background: transparent !important;
        border: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      map.current?.remove();
      document.head.removeChild(style);
    };
  }, []);

  // Swap tile layer when theme changes
  useEffect(() => {
    if (!map.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }

    const isDark = resolvedTheme === "dark";
    tileLayerRef.current = L.tileLayer(isDark ? TILES.dark : TILES.light, {
      maxZoom: 19,
      attribution: TILE_ATTRIBUTION,
      noWrap: true,
      bounds: L.latLngBounds(L.latLng(-60, -180), L.latLng(75, 180)),
    }).addTo(map.current);
  }, [resolvedTheme]);

  // Update markers when regions data changes
  useEffect(() => {
    if (!map.current) return;

    // Remove existing cluster group
    if (clusterGroupRef.current) {
      map.current.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    // Create a new MarkerClusterGroup with custom icon
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const childMarkers = cluster.getAllChildMarkers();
        // Determine worst status from child markers
        let worstStatus: 'operational' | 'issue' | 'outage' = 'operational';
        for (const child of childMarkers) {
          const status = (child as any).options.regionStatus;
          if (status === 'outage') { worstStatus = 'outage'; break; }
          if (status === 'issue') worstStatus = 'issue';
        }
        const colors = getStatusColor(worstStatus);
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `<div style="background:${colors.fill};border:2px solid ${colors.border};border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(36, 36),
          iconAnchor: L.point(18, 18),
        });
      },
    });

    // Add new markers for each region
    regions.forEach((region) => {
      const count = eventCounts[region.code] || 0;
      const colors = getStatusColor(region.status);
      const badgeHtml = count > 0
        ? `<span style="position:absolute;top:-4px;right:-4px;background:${region.status === 'outage' ? '#EF4444' : '#F59E0B'};color:white;border-radius:50%;width:16px;height:16px;font-size:9px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:1px solid white;">${count}</span>`
        : '';

      const icon = L.divIcon({
        html: `<div style="position:relative;width:16px;height:16px;"><div style="background:${colors.fill};border:2px solid ${colors.border};border-radius:50%;width:16px;height:16px;opacity:0.85;"></div>${badgeHtml}</div>`,
        className: 'custom-region-icon',
        iconSize: L.point(16, 16),
        iconAnchor: L.point(8, 8),
      });

      const marker = L.marker([region.location[1], region.location[0]], {
        icon,
        regionStatus: region.status, // custom option for cluster color calculation
      } as any);

      // Add popup with region info
      const providerName = region.provider?.toUpperCase() || 'AWS';
      const headerGradient =
        region.provider === 'azure'
          ? 'linear-gradient(135deg, #0078d4 0%, #00bcf2 100%)'
        : region.provider === 'gcp'
          ? 'linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc04 75%, #ea4335 100%)'
        : region.provider === 'oci'
          ? 'linear-gradient(135deg, #c74634 0%, #8b1a1a 100%)'
        : 'linear-gradient(135deg, #ff9900 0%, #ff7700 100%)'; // AWS default

      marker.bindPopup(`
        <div class="aws-popup-header" style="background: ${headerGradient};">
          <span>${providerName} Region</span>
        </div>
        <div class="aws-popup-body">
          <h3 class="font-semibold leading-tight" style="margin: 0;">${getCountryFlag(region.name)}${region.name}</h3>
          <p class="text-xs" style="margin: 2px 0 0 0; opacity: 0.6;">${region.code}</p>
          <span class="px-2 py-1 rounded text-xs font-medium ${region.status === 'operational' ? 'bg-emerald-100 text-emerald-800' : region.status === 'issue' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}" style="display: block; width: fit-content; margin: 4px auto 0 auto;">
            ${region.status.charAt(0).toUpperCase() + region.status.slice(1)}
          </span>
        </div>
      `, {
        className: 'aws-region-popup',
        autoPan: true,
        keepInView: true
      });

      clusterGroup.addLayer(marker);
    });

    map.current!.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;
  }, [regions, eventCounts]);

  return (
    <Card className={className || "relative w-full h-[600px] overflow-hidden rounded-lg shadow-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900"}>
      <div ref={mapContainer} className="absolute inset-0" />
    </Card>
  );
};

export default RegionMap;
