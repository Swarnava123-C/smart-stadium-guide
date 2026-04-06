import React, { useState } from 'react';
import { useStadium } from '@/contexts/StadiumContext';
import { cn } from '@/lib/utils';
import { CrowdBadge } from '@/components/CrowdBadge';
import { VenueEntity, VenueEntityType } from '@/types/stadium';
import { MapPin, Utensils, DoorOpen, Armchair, AlertTriangle, ShowerHead } from 'lucide-react';

const typeIcons: Record<VenueEntityType, React.ReactNode> = {
  gate: <DoorOpen className="w-4 h-4" />,
  food_stall: <Utensils className="w-4 h-4" />,
  washroom: <ShowerHead className="w-4 h-4" />,
  seat_block: <Armchair className="w-4 h-4" />,
  emergency_exit: <AlertTriangle className="w-4 h-4" />,
};

const densityColor = (d: string) =>
  d === 'low' ? 'hsl(160,84%,45%)' : d === 'medium' ? 'hsl(38,92%,50%)' : 'hsl(0,72%,51%)';

export const StadiumMapPage: React.FC = () => {
  const { state } = useStadium();
  const [selected, setSelected] = useState<VenueEntity | null>(null);
  const [filter, setFilter] = useState<VenueEntityType | 'all'>('all');

  const filtered = filter === 'all' ? state.entities : state.entities.filter(e => e.type === filter);

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
      <div>
        <h2 className="text-2xl font-display font-bold">
          <span className="gradient-text">Stadium Map</span>
        </h2>
        <p className="text-sm text-muted-foreground">Interactive venue layout with live crowd indicators</p>
      </div>

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
        <div className="lg:col-span-2 glass rounded-xl p-4 relative" role="img" aria-label="Stadium map">
          <svg viewBox="0 0 100 100" className="w-full aspect-square max-h-[500px]" aria-hidden="true">
            {/* Stadium outline */}
            <ellipse cx="50" cy="50" rx="45" ry="45" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" />
            <ellipse cx="50" cy="50" rx="35" ry="35" fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.3" />
            {/* Field */}
            <rect x="35" y="40" width="30" height="20" rx="2" fill="hsl(160,84%,45%)" opacity="0.15" stroke="hsl(160,84%,45%)" strokeWidth="0.3" />
            <text x="50" y="51" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="2" fontFamily="Inter">FIELD</text>

            {/* Emergency mode overlay */}
            {state.isEmergencyMode && (
              <rect x="0" y="0" width="100" height="100" fill="hsl(0,72%,51%)" opacity="0.05">
                <animate attributeName="opacity" values="0.02;0.08;0.02" dur="2s" repeatCount="indefinite" />
              </rect>
            )}

            {/* Entities */}
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

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neon-amber" /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> High</span>
          </div>
        </div>

        {/* Details Panel */}
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
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Click on any point on the map to see details about crowd density, wait times, and more.</p>
          )}
        </div>
      </div>
    </div>
  );
};
