import React, { useEffect, useRef } from 'react';

interface LocationMapProps {
  lat: number;
  lon: number;
  onLocationSelect: (lat: number, lon: number) => void;
  cityName?: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({ lat, lon, onLocationSelect, cityName }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    // Check if Leaflet is loaded
    if (!(window as any).L || !mapContainerRef.current) return;
    
    const L = (window as any).L;

    // Initialize map if not exists
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current).setView([lat, lon], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      // Create marker
      markerRef.current = L.marker([lat, lon], { draggable: true }).addTo(mapInstanceRef.current);

      // Handle drag end
      markerRef.current.on('dragend', function(event: any) {
        const position = event.target.getLatLng();
        onLocationSelect(position.lat, position.lng);
      });

      // Handle map click
      mapInstanceRef.current.on('click', function(e: any) {
        markerRef.current.setLatLng(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    } else {
      // Update view if props change significantly
      mapInstanceRef.current.setView([lat, lon], 13);
      markerRef.current.setLatLng([lat, lon]);
    }

    return () => {
      // Cleanup if needed, though usually we keep map instance alive during component life
    };
  }, [lat, lon]);

  return (
    <div className="space-y-2">
       <div className="flex justify-between items-center text-xs text-slate-500">
          <span><i className="fas fa-mouse-pointer mr-1"></i> Drag marker or click to refine location</span>
          {cityName && (
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cityName)}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:text-blue-600 flex items-center"
            >
              Open in Google Maps <i className="fas fa-external-link-alt ml-1"></i>
            </a>
          )}
       </div>
       <div 
         ref={mapContainerRef} 
         className="w-full h-64 rounded-xl border-2 border-slate-200 shadow-inner z-0"
         style={{ zIndex: 0 }}
       />
       <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-500">
         <div className="bg-slate-50 px-3 py-1 rounded">Lat: {lat.toFixed(6)}</div>
         <div className="bg-slate-50 px-3 py-1 rounded">Lon: {lon.toFixed(6)}</div>
       </div>
    </div>
  );
};