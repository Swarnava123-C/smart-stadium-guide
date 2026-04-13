import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNationalOverview } from '@/hooks/useNationalOverview';
import L from 'leaflet';
import { 
  Globe, AlertTriangle, Users, Clock, TrendingUp, Loader2, Siren, 
  Activity, Shield, ArrowRight, Radio
} from 'lucide-react';
import { cn } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

const riskColor = (risk: number) =>
  risk > 0.85 ? '#ef4444' : risk > 0.5 ? '#f59e0b' : '#22c55e';

export const NationalCommandPage: React.FC = () => {
  const navigate = useNavigate();
  const { overview, loading } = useNationalOverview();
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
    return () => { map.remove(); leafletMap.current = null; };
  }, [loading]);

  // Add heat markers
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || overview.stadiumStatuses.length === 0) return;

    const markers: L.CircleMarker[] = [];
    overview.stadiumStatuses.forEach(status => {
      const color = status.isEmergency ? '#ef4444' : riskColor(status.surgeRisk);
      const radius = status.liveEvent ? (status.occupancyPct > 80 ? 16 : 12) : 7;

      const marker = L.circleMarker(
        [status.stadium.latitude, status.stadium.longitude],
        { radius, color, fillColor: color, fillOpacity: status.liveEvent ? 0.7 : 0.3, weight: 2 }
      ).addTo(map);

      marker.bindPopup(`
        <div style="font-size:12px;min-width:180px;">
          <p style="font-weight:bold;font-size:13px;margin:0 0 4px;">${status.stadium.name}</p>
          <p style="color:#888;margin:0 0 4px;">${status.stadium.city}, ${status.stadium.state}</p>
          ${status.liveEvent ? `
            <p style="color:#22c55e;margin:0 0 2px;">🔴 ${status.liveEvent.event_name}</p>
            <p style="margin:0 0 2px;">Occupancy: ${status.occupancyPct}%</p>
            <p style="margin:0;">Surge Risk: ${Math.round(status.surgeRisk * 100)}%</p>
          ` : '<p style="color:#888;margin:0;">No live event</p>'}
          ${status.isEmergency ? '<p style="color:#ef4444;font-weight:bold;margin:4px 0 0;">🚨 EMERGENCY ACTIVE</p>' : ''}
        </div>
      `);

      marker.on('click', () => navigate(`/stadium/${status.stadium.id}`));
      markers.push(marker);
    });

    return () => markers.forEach(m => m.remove());
  }, [overview.stadiumStatuses, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const highRiskStatuses = overview.stadiumStatuses
    .filter(s => s.surgeRisk > 0.5 || s.isEmergency)
    .sort((a, b) => b.surgeRisk - a.surgeRisk);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display font-bold">
          <span className="gradient-text">National Command Center</span>
        </h2>
        <p className="text-sm text-muted-foreground">Centralized monitoring across all Indian stadiums</p>
      </div>

      {/* Global Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="glass rounded-xl p-3 text-center">
          <Radio className="w-5 h-5 text-secondary mx-auto mb-1" />
          <p className="text-lg font-bold font-mono">{overview.totalLiveEvents}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Live Events</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <Users className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold font-mono">{(overview.totalAttendanceNationwide / 1000).toFixed(1)}K</p>
          <p className="text-[10px] text-muted-foreground uppercase">Total Attendance</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <AlertTriangle className="w-5 h-5 text-neon-amber mx-auto mb-1" />
          <p className="text-lg font-bold font-mono">{overview.highRiskStadiums.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase">High Risk</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <Siren className="w-5 h-5 text-destructive mx-auto mb-1" />
          <p className="text-lg font-bold font-mono">{overview.activeEmergencies}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Emergencies</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-lg font-bold font-mono">{overview.avgWaitTimeNational}m</p>
          <p className="text-[10px] text-muted-foreground uppercase">Avg Wait</p>
        </div>
      </div>

      {/* Emergency Feed */}
      {overview.activeEmergencies > 0 && (
        <div className="glass rounded-xl p-4 border border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <Siren className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-sm text-destructive">Active Emergencies</h3>
          </div>
          {overview.stadiumStatuses.filter(s => s.isEmergency).map(s => (
            <div key={s.stadium.id} className="flex items-center justify-between py-2 border-b border-destructive/10 last:border-0">
              <div>
                <p className="text-sm font-medium">{s.stadium.name}</p>
                <p className="text-xs text-muted-foreground">{s.liveEvent?.event_name}</p>
              </div>
              <button onClick={() => navigate(`/stadium/${s.stadium.id}`)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                View <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <div ref={mapRef} className="glass rounded-xl overflow-hidden" style={{ height: '400px' }} />
        </div>

        {/* Risk Ranking */}
        <div className="glass rounded-xl p-4 space-y-3 max-h-[400px] overflow-y-auto">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Risk Severity Ranking
          </h3>
          {overview.stadiumStatuses
            .filter(s => s.liveEvent)
            .sort((a, b) => b.surgeRisk - a.surgeRisk)
            .map(s => (
              <div key={s.stadium.id} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0 cursor-pointer hover:bg-muted/30 rounded-lg px-2 transition-colors" onClick={() => navigate(`/stadium/${s.stadium.id}`)}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: riskColor(s.surgeRisk) }} />
                  <div>
                    <p className="text-xs font-medium">{s.stadium.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.liveEvent?.event_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold" style={{ color: riskColor(s.surgeRisk) }}>
                    {Math.round(s.surgeRisk * 100)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">{s.occupancyPct}% occ</p>
                </div>
              </div>
            ))}
          {overview.stadiumStatuses.filter(s => s.liveEvent).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No live events</p>
          )}
        </div>
      </div>

      {/* Inter-Stadium Comparison */}
      <div className="glass rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Stadium Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border/20">
                <th className="px-3 py-2">Stadium</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Occupancy</th>
                <th className="px-3 py-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              {overview.stadiumStatuses.map(s => (
                <tr key={s.stadium.id} className="border-b border-border/10 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(`/stadium/${s.stadium.id}`)}>
                  <td className="px-3 py-2 font-medium">{s.stadium.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.stadium.city}</td>
                  <td className="px-3 py-2">{s.liveEvent?.event_name || '—'}</td>
                  <td className="px-3 py-2">
                    {s.isEmergency ? (
                      <span className="text-destructive font-semibold text-xs">🚨 EMERGENCY</span>
                    ) : s.liveEvent ? (
                      <span className="text-secondary text-xs font-semibold">🔴 LIVE</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Idle</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono">{s.occupancyPct}%</td>
                  <td className="px-3 py-2">
                    <span className="font-mono font-bold text-xs" style={{ color: riskColor(s.surgeRisk) }}>
                      {Math.round(s.surgeRisk * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
