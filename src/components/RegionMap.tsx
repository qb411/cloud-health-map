
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { awsRegions } from "@/lib/aws-regions";
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

const RegionMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with options to limit scroll/zoom
    map.current = L.map(mapContainer.current, {
      minZoom: 1.5, // Prevent zooming out too far
      maxZoom: 8,   // Prevent zooming in too far
      maxBounds: L.latLngBounds(
        L.latLng(-60, -180), // Southwest corner
        L.latLng(75, 180)    // Northeast corner
      ),
      maxBoundsViscosity: 1.0, // Prevents dragging outside bounds
    }).setView([20, 0], 2);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
      noWrap: true, // Prevents multiple worlds from showing
      bounds: L.latLngBounds(
        L.latLng(-60, -180),
        L.latLng(75, 180)
      )
    }).addTo(map.current);

    // Add markers for each AWS region
    awsRegions.forEach((region) => {
      const marker = L.circleMarker([region.location[1], region.location[0]], {
        radius: 8,
        fillColor: '#10B981',
        color: '#059669',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map.current!);

      // Add popup with tighter padding and country flag
      marker.bindPopup(`
        <div class="pt-1 px-1 pb-0.5">
          <h3 class="font-semibold leading-none">${getCountryFlag(region.name)} ${region.name}</h3>
          <p class="text-sm text-gray-500 -mt-1 leading-none">${region.code}</p>
          <p class="text-sm font-medium text-emerald-600 mt-1.5 mb-0 leading-none">${region.status || 'Operational'}</p>
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
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <Card className="relative w-full h-[600px] overflow-hidden rounded-lg shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
    </Card>
  );
};

export default RegionMap;
