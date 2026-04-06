import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useStadiums, Stadium } from '@/hooks/useStadiums';
import { Loader2, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

const crowdColor = (status: string) =>
  status === 'low' ? '#22c55e' : status === 'medium' ? '#f59e0b' : '#ef4444';

const crowdLabel = (status: string) =>
  status === 'low' ? 'Low Crowd' : status === 'medium' ? 'Medium Crowd' : 'High Crowd';

export const IndiaMapPage: React.FC = () => {
  const { stadiums, loading } = useStadiums();
  const navigate = useNavigate();

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
      <div className="glass rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>
        <MapContainer
          center={[22.5, 79.0]}
          zoom={5}
          style={{ height: '100%', width: '100%', background: 'hsl(222 47% 6%)' }}
          scrollWheelZoom={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          {stadiums.map((stadium) => (
            <CircleMarker
              key={stadium.id}
              center={[stadium.latitude, stadium.longitude]}
              radius={stadium.crowd_status === 'high' ? 14 : stadium.crowd_status === 'medium' ? 11 : 9}
              pathOptions={{
                color: crowdColor(stadium.crowd_status),
                fillColor: crowdColor(stadium.crowd_status),
                fillOpacity: 0.6,
                weight: 2,
              }}
              eventHandlers={{
                click: () => navigate(`/stadium/${stadium.id}`),
              }}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[150px]">
                  <p className="font-bold text-sm">{stadium.name}</p>
                  <p className="text-muted-foreground">{stadium.city}, {stadium.state}</p>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>Capacity: {(stadium.capacity / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: crowdColor(stadium.crowd_status) }}
                    />
                    <span>{crowdLabel(stadium.crowd_status)}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/stadium/${stadium.id}`)}
                    className="mt-1 text-primary underline text-xs"
                  >
                    View Dashboard →
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

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
