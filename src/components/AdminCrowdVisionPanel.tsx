import React from 'react';
import { Eye, AlertTriangle, ArrowUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisionAnalytics } from '@/hooks/useCrowdVision';

interface Props {
  analytics: VisionAnalytics;
}

export const AdminCrowdVisionPanel: React.FC<Props> = ({ analytics }) => {
  const densityColor = analytics.globalDensity > 80 ? 'text-destructive' : analytics.globalDensity > 50 ? 'text-neon-amber' : 'text-secondary';

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" /> CV Crowd Analytics
        </h3>
        <span className="text-[10px] text-muted-foreground">Privacy: Anonymized blobs only</span>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center text-xs">
        <div>
          <p className={cn('text-xl font-bold font-mono', densityColor)}>{analytics.globalDensity}%</p>
          <p className="text-muted-foreground">Global Density</p>
        </div>
        <div>
          <p className={cn('text-xl font-bold font-mono', analytics.anomalyCount > 0 ? 'text-destructive' : 'text-secondary')}>
            {analytics.anomalyCount}
          </p>
          <p className="text-muted-foreground">Anomalies</p>
        </div>
        <div>
          <p className={cn('text-xl font-bold font-mono', analytics.reverseFlowDetected ? 'text-destructive' : 'text-secondary')}>
            {analytics.reverseFlowDetected ? '⚠' : '✓'}
          </p>
          <p className="text-muted-foreground">Reverse Flow</p>
        </div>
        <div>
          <p className={cn('text-xl font-bold font-mono', analytics.rapidMovementDetected ? 'text-destructive' : 'text-secondary')}>
            {analytics.rapidMovementDetected ? '⚠' : '✓'}
          </p>
          <p className="text-muted-foreground">Rapid Movement</p>
        </div>
      </div>

      {/* Camera zones heatmap */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase text-muted-foreground font-semibold">Zone Camera Feed</p>
        <div className="grid grid-cols-2 gap-1.5">
          {analytics.zones.slice(0, 8).map(zone => (
            <div key={zone.id} className={cn(
              'rounded-lg p-2 border text-xs',
              zone.abnormalBehaviorFlag ? 'border-destructive/40 bg-destructive/5' : 'border-border/20 bg-muted/20'
            )}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium truncate max-w-[100px]">{zone.zoneName}</span>
                <span className={cn('font-mono font-bold',
                  zone.visualDensityScore > 80 ? 'text-destructive' : zone.visualDensityScore > 50 ? 'text-neon-amber' : 'text-secondary'
                )}>
                  {zone.visualDensityScore}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <ArrowUp className="w-2.5 h-2.5" style={{
                    transform: `rotate(${Math.atan2(zone.movementDirection.y, zone.movementDirection.x) * (180 / Math.PI) - 90}deg)`
                  }} />
                  Flow
                </span>
                <span>Entropy: {zone.movementEntropy}</span>
                {zone.anomalyType && (
                  <span className="text-destructive font-semibold flex items-center gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5" /> {zone.anomalyType}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly timeline */}
      {analytics.anomalyTimeline.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3" /> Anomaly Timeline
          </p>
          <div className="max-h-24 overflow-y-auto space-y-0.5">
            {analytics.anomalyTimeline.slice(0, 10).map((entry, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] py-0.5">
                <span className="text-muted-foreground font-mono shrink-0">{entry.timestamp.toLocaleTimeString()}</span>
                <span className="text-destructive font-medium">{entry.type}</span>
                <span className="text-muted-foreground truncate">@ {entry.zone}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
