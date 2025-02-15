
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { awsRegions } from "@/lib/aws-regions";
import { Card } from "@/components/ui/card";

const MAPBOX_TOKEN = ""; // You'll need to provide your Mapbox token

const RegionMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
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
