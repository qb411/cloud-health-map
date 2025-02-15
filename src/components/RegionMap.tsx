
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { awsRegions } from "@/lib/aws-regions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const RegionMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState("");
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 20],
      zoom: 1.5,
    });

    map.current.on("load", () => {
      if (!map.current) return;

      // Add markers for each AWS region
      awsRegions.forEach((region) => {
        const marker = document.createElement("div");
        marker.className = "w-4 h-4 rounded-full bg-status-success transition-colors duration-300 cursor-pointer hover:scale-110";
        
        new mapboxgl.Marker(marker)
          .setLngLat(region.location)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div class="p-2">
                <h3 class="font-semibold">${region.name}</h3>
                <p class="text-sm text-gray-500">${region.code}</p>
                <p class="text-sm font-medium text-status-success">Operational</p>
              </div>`
            )
          )
          .addTo(map.current);
      });
    });

    setIsMapInitialized(true);
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!isMapInitialized) {
    return (
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Initialize Map</h3>
        <p className="text-sm text-gray-500">
          Please enter your Mapbox access token to view the map. You can find your token in the{" "}
          <a 
            href="https://account.mapbox.com/access-tokens/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Mapbox account dashboard
          </a>
          .
        </p>
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Enter your Mapbox token"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="flex-1"
          />
          <Button onClick={initializeMap} disabled={!mapboxToken}>
            Initialize Map
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative w-full h-[600px] overflow-hidden rounded-lg shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
    </Card>
  );
};

export default RegionMap;
