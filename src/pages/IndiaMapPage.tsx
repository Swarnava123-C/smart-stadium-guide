import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { useStadiums, Stadium } from '@/hooks/useStadiums';
import { Loader2, Users } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const crowdColor = (status: string) =>
  status === 'low' ? '#22c55e' : status === 'medium' ? '#f59e0b' : '#ef4444';

const crowdLabel = (status: string) =>
  status === 'low' ? 'Low Crowd' : status === 'medium' ? 'Medium Crowd' : 'High Crowd';

export const IndiaMapPage: React.FC = () => {
  const { stadiums, loading } = useStadiums();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || loading || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [22.5, 79.0],
      zoom: 5,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO',
    }).addTo(map);

    leafletMap.current = map;

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, [loading]);

  // Add markers when stadiums load
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || stadiums.length === 0) return;

    const markers: L.CircleMarker[] = [];

    stadiums.forEach((stadium) => {
      const color = crowdColor(stadium.crowd_status);
      const radius = stadium.crowd_status === 'high' ? 14 : stadium.crowd_status === 'medium' ? 11 : 9;

      const marker = L.circleMarker([stadium.latitude, stadium.longitude], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.6,
        weight: 2,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-size:12px;min-width:150px;">
          <p style="font-weight:bold;font-size:13px;margin:0 0 4px;">${stadium.name}</p>
          <p style="color:#888;margin:0 0 4px;">${stadium.city}, ${stadium.state}</p>
          <p style="margin:0 0 4px;">Capacity: ${(stadium.capacity / 1000).toFixed(0)}K</p>
          <p style="margin:0 0 4px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:4px;"></span>
            ${crowdLabel(stadium.crowd_status)}
          </p>
        </div>
      `);

      marker.on('click', () => {
        navigate(`/stadium/${stadium.id}`);
      });

      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [stadiums, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display font-bold">
          <span className="gradient-text">National Stadium Intelligence</span>
        </h2>
        <p className="text-sm text-muted-foreground">Live crowd monitoring across Indian stadiums — click a stadium to view details</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-secondary" /> Low Crowd</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-neon-amber" /> Medium Crowd</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-destructive" /> High Crowd</span>
      </div>

      {/* Map */}
      <div
        ref={mapRef}
        className="glass rounded-xl overflow-hidden"
        style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}
      />

      {/* Stadium List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stadiums.map((stadium) => (
          <button
            key={stadium.id}
            onClick={() => navigate(`/stadium/${stadium.id}`)}
            className="glass rounded-xl p-4 text-left hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{stadium.name}</h3>
                <p className="text-xs text-muted-foreground">{stadium.city}, {stadium.state}</p>
              </div>
              <span
                className="w-3 h-3 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: crowdColor(stadium.crowd_status) }}
              />
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(stadium.capacity / 1000).toFixed(0)}K</span>
              <span>{crowdLabel(stadium.crowd_status)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
