import React from 'react';
import { CrowdDensity, VenueEntity } from '@/types/stadium';
import { CrowdBadge } from '@/components/CrowdBadge';
import { cn } from '@/lib/utils';
import { DoorOpen, Utensils, Bath, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  gate: <DoorOpen className="w-4 h-4" />,
  food_stall: <Utensils className="w-4 h-4" />,
  washroom: <Bath className="w-4 h-4" />,
};

interface Props {
  entities: VenueEntity[];
  isLive: boolean;
}

export const AdminEntityGrid: React.FC<Props> = ({ entities, isLive }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {entities.map(entity => {
        const ratio = (entity.currentOccupancy || 0) / (entity.capacity || 100);
        const density: CrowdDensity = ratio < 0.4 ? 'low' : ratio < 0.7 ? 'medium' : 'high';
        const isCritical = ratio > 0.85;
        const isWarning = ratio > 0.7 && ratio <= 0.85;

        return (
          <div
            key={entity.id}
            className={cn(
              'glass rounded-xl p-3 space-y-2 transition-all duration-500',
              isCritical && isLive && 'border-destructive/50 bg-destructive/5 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
              isWarning && isLive && 'border-neon-amber/40 bg-neon-amber/5',
              !isCritical && !isWarning && 'border-border/30'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'p-1.5 rounded-lg',
                  isCritical && isLive ? 'bg-destructive/20 text-destructive' :
                  isWarning && isLive ? 'bg-neon-amber/20 text-neon-amber' :
                  'bg-primary/10 text-primary'
                )}>
                  {typeIcons[entity.type] || <DoorOpen className="w-4 h-4" />}
                </span>
                <div>
                  <h4 className="font-semibold text-sm">{entity.name}</h4>
                  <span className="text-[10px] text-muted-foreground uppercase">{entity.type.replace('_', ' ')}</span>
                </div>
              </div>
              <CrowdBadge density={density} />
            </div>

            {/* Occupancy bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Occupancy</span>
                <span className="font-mono">{Math.round(ratio * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    ratio > 0.85 ? 'bg-destructive' :
                    ratio > 0.7 ? 'bg-neon-amber' :
                    ratio > 0.4 ? 'bg-primary' : 'bg-secondary'
                  )}
                  style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Count</span>
                <p className="font-mono">{entity.currentOccupancy}/{entity.capacity}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Wait</span>
                <p className="font-mono">{entity.estimatedWaitTime}m</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className={cn(
                  'font-medium',
                  entity.isAvailable ? 'text-secondary' : 'text-destructive'
                )}>
                  {entity.isAvailable ? 'Open' : 'Closed'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
