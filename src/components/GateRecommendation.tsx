import React from 'react';
import { Brain, DoorOpen, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GateRecommendationProps {
  avgWaitTime: number;
  gateStatuses: Record<string, string>;
  currentAttendance: number;
  expectedAttendance: number;
}

export const GateRecommendation: React.FC<GateRecommendationProps> = ({
  avgWaitTime,
  gateStatuses,
  currentAttendance,
  expectedAttendance,
}) => {
  const openGates = Object.entries(gateStatuses).filter(([, s]) => s === 'open');
  const closedGates = Object.entries(gateStatuses).filter(([, s]) => s === 'closed');
  const utilization = currentAttendance / expectedAttendance;

  // Only show recommendation if conditions met
  if (avgWaitTime <= 8 || utilization <= 0.8 || closedGates.length === 0) return null;

  const estimatedReduction = Math.round((avgWaitTime * closedGates.length) / (openGates.length + closedGates.length));
  const newLoadPct = Math.round((openGates.length / (openGates.length + closedGates.length)) * 100);

  return (
    <div className="glass rounded-xl p-4 border border-primary/30 bg-primary/5 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-primary flex items-center gap-1">
            🧠 AI Recommendation
          </h4>
          <p className="text-sm text-foreground mt-1">
            Open <span className="font-semibold text-primary">
              {closedGates.map(([k]) => k.replace('_', ' ').replace('gate', 'Gate')).join(', ')}
            </span> to reduce average wait time by{' '}
            <span className="font-mono text-secondary">{estimatedReduction}-{estimatedReduction + 2} minutes</span>.
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <DoorOpen className="w-3 h-3" />
              Currently {openGates.length}/{openGates.length + closedGates.length} gates open
            </span>
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-secondary" />
              Expected load balance: {newLoadPct}% → 100%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
