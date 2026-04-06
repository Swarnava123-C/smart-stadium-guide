import React from 'react';
import { useStadium } from '@/contexts/StadiumContext';
import { StatCard } from '@/components/StatCard';
import { CrowdBadge } from '@/components/CrowdBadge';
import { Users, Clock, DoorOpen, Utensils, ShowerHead, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DashboardPage: React.FC = () => {
  const { state } = useStadium();

  const occupancyPct = Math.round((state.currentAttendance / state.totalCapacity) * 100);
  const minutesToEvent = Math.max(0, Math.round((new Date(state.eventStartTime).getTime() - Date.now()) / 60000));

  const gates = state.entities.filter(e => e.type === 'gate');
  const foodStalls = state.entities.filter(e => e.type === 'food_stall');
  const washrooms = state.entities.filter(e => e.type === 'washroom');
  const avgGateWait = Math.round(gates.reduce((s, g) => s + g.estimatedWaitTime, 0) / gates.length);
  const avgFoodWait = Math.round(foodStalls.reduce((s, f) => s + f.estimatedWaitTime, 0) / foodStalls.length);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">
          <span className="gradient-text">Dashboard</span>
        </h2>
        <p className="text-sm text-muted-foreground">Real-time stadium intelligence overview</p>
      </div>

      {state.isEmergencyMode && (
        <div className="glass rounded-xl p-4 border-destructive/50 bg-destructive/10 flex items-center gap-3 animate-pulse" role="alert">
          <AlertTriangle className="w-6 h-6 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Emergency Mode Active</p>
            <p className="text-sm text-muted-foreground">All routes redirected to nearest emergency exits. AI assistant is in emergency guidance mode.</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Attendance"
          value={`${(state.currentAttendance / 1000).toFixed(1)}K`}
          subtitle={`${occupancyPct}% capacity`}
          icon={<Users className="w-4 h-4" />}
          variant={occupancyPct > 85 ? 'danger' : 'default'}
        />
        <StatCard
          title="Event Starts"
          value={`${minutesToEvent}m`}
          subtitle="minutes remaining"
          icon={<Clock className="w-4 h-4" />}
          variant="primary"
        />
        <StatCard
          title="Avg Gate Wait"
          value={`${avgGateWait} min`}
          subtitle={`${gates.filter(g => g.crowdDensity === 'low').length} gates clear`}
          icon={<DoorOpen className="w-4 h-4" />}
        />
        <StatCard
          title="Avg Food Wait"
          value={`${avgFoodWait} min`}
          subtitle={`${foodStalls.filter(f => f.crowdDensity === 'low').length} stalls clear`}
          icon={<Utensils className="w-4 h-4" />}
        />
      </div>

      {/* Venue Entities Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Live Venue Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border/20">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Crowd</th>
                <th className="px-4 py-2">Wait</th>
                <th className="px-4 py-2">Distance</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.entities
                .filter(e => e.type !== 'seat_block' && e.type !== 'emergency_exit')
                .sort((a, b) => {
                  const order = { high: 0, medium: 1, low: 2 };
                  return order[a.crowdDensity] - order[b.crowdDensity];
                })
                .map(entity => (
                  <tr key={entity.id} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{entity.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground capitalize">{entity.type.replace('_', ' ')}</td>
                    <td className="px-4 py-2.5"><CrowdBadge density={entity.crowdDensity} /></td>
                    <td className="px-4 py-2.5 font-mono">{entity.estimatedWaitTime}m</td>
                    <td className="px-4 py-2.5 font-mono">{entity.distanceFromUser}m</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-xs font-medium', entity.isAvailable ? 'text-secondary' : 'text-destructive')}>
                        {entity.isAvailable ? 'Open' : 'Closed'}
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
