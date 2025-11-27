import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface LocationMapProps {
  lat: number;
  lon: number;
  onLocationSelect: (lat: number, lon: number) => void;
  cityName?: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({ lat, lon, onLocationSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not exists
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([lat, lon], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      // Create marker with a simple div icon to avoid asset loading issues with default leaflet markers in some build setups
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:#0d9488;width:15px;height:15px;border-radius:50%;border:2px solid white;box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>`,
        iconSize: [15, 15],
        iconAnchor: [7.5, 7.5]
      });

      markerRef.current = L.marker([lat, lon], { draggable: true, icon }).addTo(mapInstanceRef.current);
      
      markerRef.current.on('dragend', (event) => {
        const marker = event.target;
        const position = marker.getLatLng();
        onLocationSelect(position.lat, position.lng);
      });

      mapInstanceRef.current.on('click', (e) => {
         markerRef.current?.setLatLng(e.latlng);
         onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    } else {
      // Update view if props change
      mapInstanceRef.current.setView([lat, lon], 13);
      markerRef.current?.setLatLng([lat, lon]);
    }

    // Fix for map sometimes not rendering tiles correctly if container size changes
    setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
    }, 100);

  }, [lat, lon]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <i className="fas fa-map-marked-alt text-teal-600"></i> 
          <b>OpenStreetMap:</b> Click or drag marker to adjust location.
        </span>
      </div>
      <div ref={mapRef} className="w-full h-[450px] rounded-xl border-2 border-slate-200 shadow-inner z-0" />
      <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-500">
         <div className="bg-slate-50 px-3 py-1 rounded border border-slate-100 shadow-sm flex justify-between">
            <span>LATITUDE</span>
            <span className="font-bold text-slate-700">{lat.toFixed(6)}</span>
         </div>
         <div className="bg-slate-50 px-3 py-1 rounded border border-slate-100 shadow-sm flex justify-between">
            <span>LONGITUDE</span>
            <span className="font-bold text-slate-700">{lon.toFixed(6)}</span>
         </div>
       </div>
    </div>
  );
};