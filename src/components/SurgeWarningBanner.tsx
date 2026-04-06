import React from 'react';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SurgeWarningBannerProps {
  surgeRisk: number; // 0-1
  entryRate: number;
  avgWaitTime: number;
  affectedGates: string[];
}

export const SurgeWarningBanner: React.FC<SurgeWarningBannerProps> = ({
  surgeRisk,
  entryRate,
  avgWaitTime,
  affectedGates,
}) => {
  if (surgeRisk < 0.7) return null;

  const isHigh = surgeRisk >= 0.85;
  const pct = Math.round(surgeRisk * 100);

  return (
    <div
      className={cn(
        'glass rounded-xl p-4 border animate-fade-in',
        isHigh
          ? 'border-destructive/50 bg-destructive/10'
          : 'border-neon-amber/50 bg-neon-amber/5'
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          isHigh ? 'bg-destructive/20' : 'bg-neon-amber/20'
        )}>
          <AlertTriangle className={cn('w-5 h-5', isHigh ? 'text-destructive' : 'text-neon-amber')} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={cn('font-semibold text-sm', isHigh ? 'text-destructive' : 'text-neon-amber')}>
              {isHigh ? '🚨 High Probability of Congestion' : '⚠️ Moderate Surge Risk'}
            </h4>
            <span className={cn(
              'text-xs font-mono px-2 py-0.5 rounded-full',
              isHigh ? 'bg-destructive/20 text-destructive' : 'bg-neon-amber/20 text-neon-amber'
            )}>
              {pct}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Entry rate: <span className="font-mono text-foreground">{entryRate}</span>/min •
            Avg wait: <span className="font-mono text-foreground">{avgWaitTime.toFixed(1)}</span> min
            {affectedGates.length > 0 && (
              <> • Affected: <span className="text-foreground">{affectedGates.join(', ')}</span></>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Projected congestion in <span className="font-semibold text-foreground">15 minutes</span> based on current entry trends
          </p>
        </div>
      </div>
    </div>
  );
};
