import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventDetail } from '@/hooks/useEventDetail';
import { generateVenueEntities } from '@/data/venueGenerator';
import { CrowdBadge } from '@/components/CrowdBadge';
import { CrowdDensity } from '@/types/stadium';
import { ArrowLeft, Calendar, Users, Clock, TrendingUp, DoorOpen, Utensils, Bath, Armchair, AlertTriangle, Loader2, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, React.ReactNode> = {
  gate: <DoorOpen className="w-4 h-4" />,
  food_stall: <Utensils className="w-4 h-4" />,
  washroom: <Bath className="w-4 h-4" />,
  seat_block: <Armchair className="w-4 h-4" />,
  emergency_exit: <AlertTriangle className="w-4 h-4" />,
};

const typeLabels: Record<string, string> = {
  gate: 'Gate',
  food_stall: 'Food Stall',
  washroom: 'Washroom',
  seat_block: 'Seat Block',
  emergency_exit: 'Emergency Exit',
};

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { event, stadium, logs, loading } = useEventDetail(eventId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event || !stadium) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Event not found</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm mt-2 underline">Go back</button>
      </div>
    );
  }

  const isLive = event.status === 'live';
  const isPast = event.status === 'completed';
  const isFuture = event.status === 'upcoming';

  const occupancyPct = Math.round((event.current_attendance / stadium.capacity) * 100);
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const entryRate = latestLog?.entry_rate || 0;
  const avgWaitTime = latestLog?.avg_wait_time || 0;

  // Generate dynamic venue entities based on stadium
  const baseEntities = generateVenueEntities(stadium.id, stadium.capacity);
  const venueEntities = baseEntities.map(entity => {
    if (isPast) {
      return { ...entity, isAvailable: false, crowdDensity: 'low' as CrowdDensity, estimatedWaitTime: 0, currentOccupancy: 0 };
    }
    if (isFuture) {
      return entity;
    }
    // Live: simulate crowd based on current attendance ratio
    const ratio = event.current_attendance / event.expected_attendance;
    const entityRatio = Math.min(1, ratio * (0.7 + Math.random() * 0.6));
    const density: CrowdDensity = entityRatio < 0.4 ? 'low' : entityRatio < 0.7 ? 'medium' : 'high';
    const baseWait = entity.type === 'food_stall' ? 5 : entity.type === 'washroom' ? 3 : entity.type === 'gate' ? 2 : 0;
    return {
      ...entity,
      crowdDensity: density,
      estimatedWaitTime: Math.round(baseWait + entityRatio * baseWait * 3),
      currentOccupancy: Math.round((entity.capacity || 100) * entityRatio),
    };
  });

  const statusBadge = isLive
    ? <span className="flex items-center gap-1.5 text-xs font-semibold text-secondary"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />LIVE</span>
    : isPast
      ? <span className="text-xs font-semibold text-muted-foreground">COMPLETED</span>
      : <span className="flex items-center gap-1.5 text-xs font-semibold text-primary"><Timer className="w-3 h-3" />UPCOMING</span>;

  const PendingValue = () => (
    <span className="text-xs text-muted-foreground italic">Will be updated live</span>
  );

  const entityGroups = [
    { label: 'Gates', types: ['gate'] },
    { label: 'Food Stalls', types: ['food_stall'] },
    { label: 'Washrooms', types: ['washroom'] },
    { label: 'Seat Blocks', types: ['seat_block'] },
    { label: 'Emergency Exits', types: ['emergency_exit'] },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="mt-1 p-1.5 rounded-lg glass hover:bg-muted/50 transition-colors" aria-label="Go back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-bold">
            <span className="gradient-text">{event.event_name}</span>
          </h2>
          <p className="text-sm text-muted-foreground">{stadium.name} • {stadium.city}</p>
        </div>
        {statusBadge}
      </div>

      {/* Event Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] uppercase font-medium">Event Date</span>
          </div>
          <p className="text-sm font-semibold">{new Date(event.event_date).toLocaleDateString()}</p>
          <p className="text-xs text-muted-foreground">{new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div className="glass rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-[10px] uppercase font-medium">Attendance</span>
          </div>
          {isFuture ? <PendingValue /> : (
            <>
              <p className="text-sm font-semibold">{(event.current_attendance / 1000).toFixed(1)}K / {(event.expected_attendance / 1000).toFixed(0)}K</p>
              <p className="text-xs text-muted-foreground">{occupancyPct}% of capacity</p>
            </>
          )}
        </div>

        <div className="glass rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] uppercase font-medium">Avg Gate Wait</span>
          </div>
          {isFuture ? <PendingValue /> : (
            <>
              <p className={cn('text-sm font-semibold', avgWaitTime > 8 ? 'text-destructive' : '')}>{avgWaitTime.toFixed(1)} min</p>
              <p className="text-xs text-muted-foreground">{isPast ? 'Final average' : avgWaitTime > 8 ? 'Above threshold' : 'Normal'}</p>
            </>
          )}
        </div>

        <div className="glass rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] uppercase font-medium">Entry Rate</span>
          </div>
          {isFuture ? <PendingValue /> : (
            <>
              <p className="text-sm font-semibold">{entryRate}/min</p>
              <p className="text-xs text-muted-foreground">{isPast ? 'Peak rate recorded' : 'Current rate'}</p>
            </>
          )}
        </div>
      </div>

      {/* Risk Score */}
      {event.risk_score !== null && (
        <div className="glass rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">AI Risk Prediction</p>
            <p className={cn('text-lg font-bold',
              (event.risk_score || 0) >= 0.8 ? 'text-destructive' :
              (event.risk_score || 0) >= 0.6 ? 'text-neon-amber' : 'text-secondary'
            )}>
              {Math.round((event.risk_score || 0) * 100)}% Risk
            </p>
          </div>
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all',
                (event.risk_score || 0) >= 0.8 ? 'bg-destructive' :
                (event.risk_score || 0) >= 0.6 ? 'bg-neon-amber' : 'bg-secondary'
              )}
              style={{ width: `${Math.round((event.risk_score || 0) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Venue Status Tables */}
      {entityGroups.map(group => {
        const entities = venueEntities.filter(e => group.types.includes(e.type));
        if (entities.length === 0) return null;

        return (
          <div key={group.label} className="glass rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
              {typeIcons[group.types[0]]}
              <h3 className="font-display font-semibold text-sm">{group.label}</h3>
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
                  {entities.map(entity => (
                    <tr key={entity.id} className="border-b border-border/10">
                      <td className="px-4 py-2.5 font-medium">{entity.name}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{typeLabels[entity.type]}</td>
                      <td className="px-4 py-2.5">
                        {isFuture ? <PendingValue /> : <CrowdBadge density={entity.crowdDensity} />}
                      </td>
                      <td className="px-4 py-2.5 font-mono">
                        {isFuture ? <PendingValue /> : `${entity.estimatedWaitTime} min`}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">{entity.distanceFromUser}m</td>
                      <td className="px-4 py-2.5">
                        {isFuture ? (
                          <PendingValue />
                        ) : isPast ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Closed</span>
                        ) : entity.isAvailable ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">Open</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};
