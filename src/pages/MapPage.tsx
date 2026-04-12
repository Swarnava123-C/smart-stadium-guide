import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStadium } from '@/contexts/StadiumContext';
import { useStadiumDetail } from '@/hooks/useStadiums';
import { generateVenueEntities } from '@/data/venueGenerator';
import { useRouteOptimizer } from '@/hooks/useRouteOptimizer';
import { cn } from '@/lib/utils';
import { CrowdBadge } from '@/components/CrowdBadge';
import { RouteOverlay } from '@/components/RouteOverlay';
import { RouteInfoPanel } from '@/components/RouteInfoPanel';
import { VenueEntity, VenueEntityType, CrowdDensity } from '@/types/stadium';
import { MapPin, Utensils, DoorOpen, Armchair, AlertTriangle, ShowerHead, ArrowLeft, Loader2, Activity, Navigation, X } from 'lucide-react';

const typeIcons: Record<VenueEntityType, React.ReactNode> = {
  gate: <DoorOpen className="w-4 h-4" />,
  food_stall: <Utensils className="w-4 h-4" />,
  washroom: <ShowerHead className="w-4 h-4" />,
  seat_block: <Armchair className="w-4 h-4" />,
  emergency_exit: <AlertTriangle className="w-4 h-4" />,
};

const densityColor = (d: string) =>
  d === 'low' ? 'hsl(160,84%,45%)' : d === 'medium' ? 'hsl(38,92%,50%)' : 'hsl(0,72%,51%)';

function simulateEntity(entity: VenueEntity): VenueEntity {
  if (entity.type === 'emergency_exit') return entity;
  const capacity = entity.capacity || 100;
  const currentOcc = entity.currentOccupancy || 0;
  const fluctuation = (Math.random() - 0.5) * 0.1;
  const newOcc = Math.max(0, Math.min(capacity, Math.round(currentOcc + capacity * fluctuation)));
  const ratio = newOcc / capacity;
  const density: CrowdDensity = ratio < 0.4 ? 'low' : ratio < 0.7 ? 'medium' : 'high';
  const baseWait = entity.type === 'food_stall' ? 5 : entity.type === 'washroom' ? 3 : entity.type === 'gate' ? 2 : 0;
  return {
    ...entity,
    currentOccupancy: newOcc,
    crowdDensity: density,
    estimatedWaitTime: Math.round(baseWait + ratio * baseWait * 3),
  };
}

export const StadiumMapPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useStadium();
  const { stadium, events, loading } = useStadiumDetail(id);

  const [selected, setSelected] = useState<VenueEntity | null>(null);
  const [filter, setFilter] = useState<VenueEntityType | 'all'>('all');
  const [showAlternateRoute, setShowAlternateRoute] = useState(false);

  const baseEntities = useMemo(() => {
    if (!stadium) return [];
    return generateVenueEntities(stadium.id, stadium.name, stadium.capacity);
  }, [stadium]);

  const [entities, setEntities] = useState<VenueEntity[]>([]);

  useEffect(() => {
    setEntities(baseEntities);
  }, [baseEntities]);

  const liveEvent = events.find(e => e.status === 'live');

  // Route optimizer
  const { activeRoute, calculateOptimalRoute, clearRoute, userPosition } = useRouteOptimizer(entities, state.isEmergencyMode);

  useEffect(() => {
    if (!liveEvent || state.isEmergencyMode) return;
    const interval = setInterval(() => {
      setEntities(prev => prev.map(simulateEntity));
    }, 8000);
    return () => clearInterval(interval);
  }, [liveEvent, state.isEmergencyMode]);

  useEffect(() => {
    if (state.isEmergencyMode) {
      setEntities(prev => prev.map(e => {
        if (e.type === 'gate') return { ...e, isAvailable: true, crowdDensity: 'high' as CrowdDensity };
        if (e.type === 'emergency_exit') return { ...e, isAvailable: true };
        return e;
      }));
    }
  }, [state.isEmergencyMode]);

  const handleNavigateTo = (entity: VenueEntity) => {
    calculateOptimalRoute(entity);
    setSelected(entity);
    setShowAlternateRoute(false);
  };

  const handleSwitchToAlternate = () => {
    if (activeRoute?.alternateRoute) {
      calculateOptimalRoute(activeRoute.alternateRoute.destination);
      setSelected(activeRoute.alternateRoute.destination);
    }
  };

  if (!id) {
    return (
      <div className="text-center py-20 space-y-3">
        <MapPin className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="text-muted-foreground">Select a stadium from the map to view its venue layout</p>
        <button onClick={() => navigate('/')} className="text-primary text-sm underline">Go to Stadium Map</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stadium) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Stadium not found</p>
        <button onClick={() => navigate('/')} className="text-primary text-sm mt-2 underline">Go back</button>
      </div>
    );
  }

  const filtered = filter === 'all' ? entities : entities.filter(e => e.type === filter);

  const filters: { value: VenueEntityType | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'gate', label: 'Gates' },
    { value: 'food_stall', label: 'Food' },
    { value: 'washroom', label: 'Washrooms' },
    { value: 'seat_block', label: 'Seats' },
    { value: 'emergency_exit', label: 'Exits' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(`/stadium/${id}`)}
          className="mt-1 p-1.5 rounded-lg glass hover:bg-muted/50 transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold">
            <span className="gradient-text">{stadium.name} — Venue Map</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {stadium.city}, {stadium.state} • Capacity: {(stadium.capacity / 1000).toFixed(0)}K
            {liveEvent && <span className="text-secondary ml-2">• 🔴 {liveEvent.event_name} (LIVE)</span>}
          </p>
        </div>
        <CrowdBadge density={stadium.crowd_status as any} />
      </div>

      {/* Live Event Banner */}
      {liveEvent && (
        <div className="glass rounded-xl p-3 flex items-center gap-3 border-secondary/30 bg-secondary/5">
          <Activity className="w-5 h-5 text-secondary animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-secondary">Live Event: {liveEvent.event_name}</p>
            <p className="text-xs text-muted-foreground">
              Attendance: {(liveEvent.current_attendance / 1000).toFixed(1)}K / {(liveEvent.expected_attendance / 1000).toFixed(0)}K — Click any venue point and tap "Navigate" for optimized routing
            </p>
          </div>
        </div>
      )}

      {!liveEvent && (
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-sm text-muted-foreground">No live event — showing default venue layout with static data</p>
        </div>
      )}

      {/* Emergency Route Banner */}
      {state.isEmergencyMode && (
        <div className="glass rounded-xl p-3 border-destructive/50 bg-destructive/10 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-sm font-bold text-destructive">🚨 EMERGENCY — Follow highlighted route to nearest exit</p>
              <p className="text-xs text-muted-foreground">All other navigation disabled. Proceed calmly.</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Map filters">
        {filters.map(f => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              filter === f.value
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'glass text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* SVG Map */}
        <div className="lg:col-span-2 glass rounded-xl p-4 relative" role="img" aria-label="Stadium venue map">
          <svg viewBox="0 0 100 100" className="w-full aspect-square max-h-[500px]" aria-hidden="true">
            <ellipse cx="50" cy="50" rx="45" ry="45" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" />
            <ellipse cx="50" cy="50" rx="35" ry="35" fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.3" />
            <rect x="35" y="40" width="30" height="20" rx="2" fill="hsl(160,84%,45%)" opacity="0.15" stroke="hsl(160,84%,45%)" strokeWidth="0.3" />
            <text x="50" y="51" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="2" fontFamily="Inter">FIELD</text>

            {state.isEmergencyMode && (
              <rect x="0" y="0" width="100" height="100" fill="hsl(0,72%,51%)" opacity="0.05">
                <animate attributeName="opacity" values="0.02;0.08;0.02" dur="2s" repeatCount="indefinite" />
              </rect>
            )}

            {/* Crowd Heatmap overlay (subtle) */}
            {liveEvent && entities.filter(e => e.crowdDensity === 'high').map(entity => (
              <circle
                key={`heat-${entity.id}`}
                cx={entity.position.x}
                cy={entity.position.y}
                r="8"
                fill="hsl(0,72%,51%)"
                opacity="0.06"
              />
            ))}
            {liveEvent && entities.filter(e => e.crowdDensity === 'medium').map(entity => (
              <circle
                key={`heat-${entity.id}`}
                cx={entity.position.x}
                cy={entity.position.y}
                r="6"
                fill="hsl(38,92%,50%)"
                opacity="0.04"
              />
            ))}

            {/* Route Overlay */}
            <RouteOverlay route={activeRoute} userPosition={userPosition} showAlternate={showAlternateRoute} />

            {filtered.map(entity => {
              const isEmergencyExit = entity.type === 'emergency_exit';
              const showPulse = state.isEmergencyMode && isEmergencyExit;
              const color = densityColor(entity.crowdDensity);
              const isSelected = selected?.id === entity.id;

              return (
                <g
                  key={entity.id}
                  onClick={() => setSelected(entity)}
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`${entity.name}: ${entity.crowdDensity} density`}
                  onKeyDown={e => e.key === 'Enter' && setSelected(entity)}
                >
                  {showPulse && (
                    <circle cx={entity.position.x} cy={entity.position.y} r="4" fill={color} opacity="0.3">
                      <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={entity.position.x}
                    cy={entity.position.y}
                    r={isSelected ? '3' : '2'}
                    fill={entity.isAvailable ? color : 'hsl(var(--muted))'}
                    stroke={isSelected ? 'hsl(var(--foreground))' : 'none'}
                    strokeWidth="0.4"
                    opacity={entity.isAvailable ? 1 : 0.4}
                  />
                  <text
                    x={entity.position.x}
                    y={entity.position.y - 3.5}
                    textAnchor="middle"
                    fill="hsl(var(--muted-foreground))"
                    fontSize="1.6"
                    fontFamily="Inter"
                  >
                    {entity.name.split(' ').slice(0, 2).join(' ')}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-4 left-4 flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neon-amber" /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> High</span>
          </div>
        </div>

        {/* Details Panel */}
        <div className="space-y-3">
          {/* Route Info */}
          {activeRoute && (
            <RouteInfoPanel
              route={activeRoute}
              onSwitchToAlternate={handleSwitchToAlternate}
              onClose={clearRoute}
            />
          )}

          {/* Entity Details */}
          <div className="glass rounded-xl p-4 space-y-3">
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              {selected ? 'Details' : 'Select a Point'}
            </h3>
            {selected ? (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-primary">{typeIcons[selected.type]}</span>
                  <h4 className="font-semibold">{selected.name}</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Crowd</span>
                    <CrowdBadge density={selected.crowdDensity} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wait Time</span>
                    <span className="font-mono">{selected.estimatedWaitTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distance</span>
                    <span className="font-mono">{selected.distanceFromUser}m</span>
                  </div>
                  {selected.capacity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Occupancy</span>
                      <span className="font-mono">{selected.currentOccupancy}/{selected.capacity}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={selected.isAvailable ? 'text-secondary' : 'text-destructive'}>
                      {selected.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
                {selected.capacity && (
                  <div className="pt-2">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          selected.crowdDensity === 'low' && 'bg-secondary',
                          selected.crowdDensity === 'medium' && 'bg-neon-amber',
                          selected.crowdDensity === 'high' && 'bg-destructive',
                        )}
                        style={{ width: `${((selected.currentOccupancy || 0) / selected.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Navigate Button */}
                {!state.isEmergencyMode && (
                  <button
                    onClick={() => handleNavigateTo(selected)}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigate Here
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Click on any point on the map to see details and get optimized route navigation.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
