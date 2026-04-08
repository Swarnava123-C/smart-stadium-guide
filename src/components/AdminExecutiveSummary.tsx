import React from 'react';
import { Activity, AlertTriangle, Clock, Gauge, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VenueEntity } from '@/types/stadium';

interface Props {
  entities: VenueEntity[];
  currentAttendance: number;
  capacity: number;
  surgeRisk: number;
  avgWaitTime: number;
  entryRate: number;
}

export const AdminExecutiveSummary: React.FC<Props> = ({
  entities, currentAttendance, capacity, surgeRisk, avgWaitTime, entryRate
}) => {
  const highZones = entities.filter(e => {
    const r = (e.currentOccupancy || 0) / (e.capacity || 1);
    return r > 0.7;
  }).length;
  const medZones = entities.filter(e => {
    const r = (e.currentOccupancy || 0) / (e.capacity || 1);
    return r > 0.4 && r <= 0.7;
  }).length;
  const lowZones = entities.filter(e => {
    const r = (e.currentOccupancy || 0) / (e.capacity || 1);
    return r <= 0.4;
  }).length;

  const occupancyPct = capacity > 0 ? Math.round((currentAttendance / capacity) * 100) : 0;

  const items = [
    {
      label: 'High Density',
      value: highZones,
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      label: 'Medium',
      value: medZones,
      icon: <Activity className="w-3.5 h-3.5" />,
      color: 'text-neon-amber',
      bg: 'bg-neon-amber/10',
    },
    {
      label: 'Low',
      value: lowZones,
      icon: <Shield className="w-3.5 h-3.5" />,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      label: 'Avg Wait',
      value: `${avgWaitTime.toFixed(1)}m`,
      icon: <Clock className="w-3.5 h-3.5" />,
      color: avgWaitTime > 8 ? 'text-destructive' : 'text-primary',
      bg: avgWaitTime > 8 ? 'bg-destructive/10' : 'bg-primary/10',
    },
    {
      label: 'Entry Rate',
      value: `${entryRate}/m`,
      icon: <Zap className="w-3.5 h-3.5" />,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Surge Risk',
      value: `${Math.round(surgeRisk * 100)}%`,
      icon: <Gauge className="w-3.5 h-3.5" />,
      color: surgeRisk > 0.7 ? 'text-destructive' : surgeRisk > 0.4 ? 'text-neon-amber' : 'text-secondary',
      bg: surgeRisk > 0.7 ? 'bg-destructive/10' : surgeRisk > 0.4 ? 'bg-neon-amber/10' : 'bg-secondary/10',
    },
  ];

  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Executive Summary</h3>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-[10px] font-medium text-secondary">LIVE</span>
          <span className="text-[10px] text-muted-foreground">• {occupancyPct}% capacity</span>
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {items.map(item => (
          <div key={item.label} className={cn('rounded-lg p-2 text-center', item.bg)}>
            <div className={cn('flex items-center justify-center gap-1 mb-1', item.color)}>
              {item.icon}
            </div>
            <p className={cn('text-lg font-bold font-mono', item.color)}>{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
