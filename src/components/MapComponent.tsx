'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Define marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Set default icon for all markers
L.Marker.prototype.options.icon = defaultIcon;

interface MapComponentProps {
  data: any[];
}

export default function MapComponent({ data }: MapComponentProps) {
  useEffect(() => {
    return () => {
      const containers = document.querySelectorAll('.leaflet-container');
      containers.forEach(container => {
        // @ts-ignore
        if (container._leaflet_id) {
          // @ts-ignore
          container._leaflet = null;
          // @ts-ignore
          container._leaflet_id = null;
        }
      });
    };
  }, []);

  // Calculate center point from data or use default
  const center = data.length > 0 
    ? [
        data.reduce((sum, item) => sum + parseFloat(item['רוחב']), 0) / data.length,
        data.reduce((sum, item) => sum + parseFloat(item['אורך']), 0) / data.length
      ] as [number, number]
    : [31.0461, 34.8516] as [number, number];

  // Calculate appropriate zoom level based on data points
  const getZoomLevel = () => {
    if (data.length === 0) return 7;
    
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    
    data.forEach(item => {
      const lat = parseFloat(item['רוחב']);
      const lng = parseFloat(item['אורך']);
      if (!isNaN(lat) && !isNaN(lng)) {
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      }
    });
    
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    if (maxDiff > 2) return 7;
    if (maxDiff > 1) return 8;
    if (maxDiff > 0.5) return 9;
    if (maxDiff > 0.1) return 10;
    return 11;
  };

  return (
    <MapContainer
      center={center}
      zoom={getZoomLevel()}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {data.map((item, index) => {
        const lat = parseFloat(item['רוחב']);
        const lng = parseFloat(item['אורך']);

        if (!isNaN(lat) && !isNaN(lng)) {
          return (
            <Marker 
              key={`marker-${index}-${lat}-${lng}`}
              position={[lat, lng]}
            >
              <Popup>
                <div dir="rtl" className="text-right">
                  <div className="font-bold mb-2">{item['שם'] || 'פריט ללא שם'}</div>
                  <div><strong>דגם:</strong> {item['דגם'] || '-'}</div>
                  <div><strong>יצרן:</strong> {item['יצרן'] || '-'}</div>
                  <div><strong>מקור:</strong> {item['מקור']}</div>
                  <div><strong>סטטוס:</strong> {item['סטטוס'] || '-'}</div>
                  <div><strong>בעלים:</strong> {item['בעלים'] || '-'}</div>
                  <div><strong>טלפון:</strong> {item['טלפון בעלים'] || '-'}</div>
                </div>
              </Popup>
            </Marker>
          );
        }
        return null;
      })}
    </MapContainer>
  );
}