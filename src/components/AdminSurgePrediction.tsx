import React from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  surgeRisk: number;
  entryRate: number;
  avgWaitTime: number;
  occupancyPct: number;
  gateStatuses: Record<string, string>;
  capacity: number;
  currentAttendance: number;
}

export const AdminSurgePrediction: React.FC<Props> = ({
  surgeRisk, entryRate, avgWaitTime, occupancyPct, gateStatuses, capacity, currentAttendance
}) => {
  const riskPct = Math.round(surgeRisk * 100);
  const riskLevel = riskPct >= 70 ? 'High' : riskPct >= 40 ? 'Medium' : 'Low';
  const riskColor = riskPct >= 70 ? 'text-destructive' : riskPct >= 40 ? 'text-neon-amber' : 'text-secondary';
  const riskBg = riskPct >= 70 ? 'bg-destructive/10 border-destructive/30' : riskPct >= 40 ? 'bg-neon-amber/10 border-neon-amber/30' : 'bg-secondary/10 border-secondary/30';

  // Compute congestion index
  const openGates = Object.values(gateStatuses).filter(s => s === 'open').length;
  const totalGates = Object.keys(gateStatuses).length || 4;
  const congestionIndex = openGates > 0 ? Math.round((currentAttendance / capacity) * (totalGates / openGates) * 100) : 0;

  // AI recommendation
  const recommendations: string[] = [];
  if (avgWaitTime > 8) {
    const closedGates = Object.entries(gateStatuses).filter(([, s]) => s !== 'open').map(([k]) => k.replace('_', ' '));
    if (closedGates.length > 0) {
      recommendations.push(`Open ${closedGates[0]} to reduce avg wait by ~${(avgWaitTime * 0.3).toFixed(1)} min`);
    }
  }
  if (entryRate > 200) {
    recommendations.push('Deploy additional security at high-traffic gates');
  }
  if (occupancyPct > 80) {
    recommendations.push('Consider restricting new entry at capacity-critical gates');
  }
  if (surgeRisk > 0.5) {
    recommendations.push('Activate crowd dispersal protocol at congested zones');
  }
  if (recommendations.length === 0) {
    recommendations.push('All systems nominal. No action required.');
  }

  return (
    <div className={cn('glass rounded-xl p-4 border', riskBg)}>
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-sm">Surge Prediction Panel</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">Decision Intelligence</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Surge Risk</p>
          <p className={cn('text-2xl font-bold font-mono', riskColor)}>{riskPct}%</p>
          <p className={cn('text-xs font-semibold', riskColor)}>{riskLevel}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Entry Rate</p>
          <p className="text-2xl font-bold font-mono text-primary">{entryRate}</p>
          <p className="text-xs text-muted-foreground">per min</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Congestion Idx</p>
          <p className={cn('text-2xl font-bold font-mono', congestionIndex > 100 ? 'text-destructive' : 'text-primary')}>{congestionIndex}</p>
          <p className="text-xs text-muted-foreground">{congestionIndex > 100 ? 'Over capacity' : 'Normal'}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Avg Wait</p>
          <p className={cn('text-2xl font-bold font-mono', avgWaitTime > 8 ? 'text-destructive' : 'text-primary')}>{avgWaitTime.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">minutes</p>
        </div>
      </div>

      <div className="border-t border-border/20 pt-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-primary" />
          <p className="text-xs font-semibold text-primary">AI Recommendations</p>
        </div>
        <div className="space-y-1.5">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-primary mt-0.5">🧠</span>
              <span className="text-muted-foreground">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
