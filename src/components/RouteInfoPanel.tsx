import React from 'react';
import { OptimizedRoute } from '@/hooks/useRouteOptimizer';
import { CrowdBadge } from '@/components/CrowdBadge';
import { Navigation, Clock, Footprints, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RouteInfoPanelProps {
  route: OptimizedRoute;
  onSwitchToAlternate?: () => void;
  onClose: () => void;
}

export const RouteInfoPanel: React.FC<RouteInfoPanelProps> = ({ route, onSwitchToAlternate, onClose }) => {
  return (
    <div className={cn(
      'glass rounded-xl p-3 space-y-2 animate-fade-in border',
      route.isEmergency ? 'border-destructive/50 bg-destructive/5' : 'border-primary/20'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {route.isEmergency ? (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          ) : (
            <Navigation className="w-4 h-4 text-primary" />
          )}
          <h4 className={cn('text-sm font-semibold', route.isEmergency ? 'text-destructive' : 'text-foreground')}>
            {route.isEmergency ? 'Emergency Route' : 'Optimized Route'}
          </h4>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted/50">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>You</span>
        <ArrowRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{route.destination.name}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="glass rounded-lg p-2">
          <Clock className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
          <p className="text-sm font-mono font-bold">{route.estimatedTime}m</p>
          <p className="text-[9px] text-muted-foreground">Est. time</p>
        </div>
        <div className="glass rounded-lg p-2">
          <Footprints className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
          <p className="text-sm font-mono font-bold">{route.totalDistance}m</p>
          <p className="text-[9px] text-muted-foreground">Distance</p>
        </div>
        <div className="glass rounded-lg p-2">
          <p className="text-[9px] text-muted-foreground mb-1">Crowd</p>
          <CrowdBadge density={route.crowdLevel} />
        </div>
      </div>

      {route.crowdLevel === 'high' && !route.isEmergency && (
        <p className="text-[10px] text-neon-amber flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          High density along route. Alternate paths being monitored.
        </p>
      )}

      {route.alternateRoute && !route.isEmergency && (
        <div className="pt-1 border-t border-border/20">
          <button
            onClick={onSwitchToAlternate}
            className="w-full text-left flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Alternate Route</p>
              <p className="text-xs">
                via {route.alternateRoute.destination.name} —{' '}
                <span className="font-mono">{route.alternateRoute.estimatedTime}m</span>,{' '}
                <span className="font-mono">{route.alternateRoute.destination.estimatedWaitTime}min wait</span>
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
      )}

      {route.isEmergency && (
        <p className="text-[10px] text-destructive font-medium">
          ⚠️ Follow this route to the nearest safe exit immediately.
        </p>
      )}
    </div>
  );
};
