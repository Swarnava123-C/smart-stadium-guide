import React, { lazy, Suspense, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStadiumDetail } from '@/hooks/useStadiums';
import { useSimulation } from '@/hooks/useSimulation';
import { useStadium } from '@/contexts/StadiumContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SyncIndicator } from '@/components/SyncIndicator';
import { StatCard } from '@/components/StatCard';
import { SurgeWarningBanner } from '@/components/SurgeWarningBanner';
import { GateRecommendation } from '@/components/GateRecommendation';
import { AttendanceTrendChart } from '@/components/AttendanceTrendChart';
import { CrowdBadge } from '@/components/CrowdBadge';
import { Users, Clock, Activity, TrendingUp, ArrowLeft, Calendar, AlertTriangle, DoorOpen, Loader2, Map, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const StadiumDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stadium, events, logs, snapshots, loading, syncing } = useStadiumDetail(id);
  const { state } = useStadium();

  const liveEvents = useMemo(() => events.filter(e => e.status === 'live' || e.status === 'upcoming'), [events]);
  useSimulation(liveEvents, state.isEmergencyMode);

  const liveEvent = useMemo(() => events.find(e => e.status === 'live'), [events]);
  const upcomingEvents = useMemo(() => events.filter(e => e.status === 'upcoming'), [events]);
  const completedEvents = useMemo(() => events.filter(e => e.status === 'completed'), [events]);

  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const occupancyPct = liveEvent ? Math.round((liveEvent.current_attendance / (stadium?.capacity || 1)) * 100) : 0;
  const surgeRisk = latestLog?.surge_risk_score || 0;
  const entryRate = latestLog?.entry_rate || 0;
  const avgWaitTime = latestLog?.avg_wait_time || 0;
  const gateStatuses = (latestLog?.gate_statuses || {}) as Record<string, string>;
  const affectedGates = Object.entries(gateStatuses).filter(([, s]) => s === 'open').map(([k]) => k.replace('_', ' ').replace('gate', 'Gate'));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stadium) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Stadium not found</p>
        <button onClick={() => navigate('/')} className="text-primary text-sm mt-2 underline">Go back</button>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Dashboard failed to load">
      <div className="space-y-4">
        <SyncIndicator visible={syncing} />

        {/* Header */}
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/')} className="mt-1 p-1.5 rounded-lg glass hover:bg-muted/50 transition-colors duration-200" aria-label="Back to map">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold">
              <span className="gradient-text">{stadium.name}</span>
            </h1>
            <p className="text-sm text-muted-foreground">{stadium.city}, {stadium.state} • Capacity: {(stadium.capacity / 1000).toFixed(0)}K</p>
          </div>
          <button onClick={() => navigate(`/venue-map/${stadium.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-medium text-primary hover:bg-primary/10 transition-colors duration-200">
            <Map className="w-3.5 h-3.5" /> Venue Map
          </button>
          <CrowdBadge density={stadium.crowd_status as any} />
        </div>

        {/* Emergency Banner */}
        {state.isEmergencyMode && (
          <div className="glass rounded-xl p-4 border-destructive/50 bg-destructive/10 flex items-center gap-3" role="alert">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Emergency Mode Active</p>
              <p className="text-sm text-muted-foreground">All gates forced open. Evacuation protocol engaged.</p>
            </div>
          </div>
        )}

        {/* Surge Warning */}
        {liveEvent && !state.isEmergencyMode && (
          <SurgeWarningBanner surgeRisk={surgeRisk} entryRate={entryRate} avgWaitTime={avgWaitTime} affectedGates={affectedGates} />
        )}

        {/* Gate Recommendation */}
        {liveEvent && !state.isEmergencyMode && (
          <GateRecommendation avgWaitTime={avgWaitTime} gateStatuses={gateStatuses} currentAttendance={liveEvent.current_attendance} expectedAttendance={liveEvent.expected_attendance} />
        )}

        {/* Live Event Stats */}
        {liveEvent && (
          <>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="font-medium text-secondary">LIVE</span>
              <span className="text-muted-foreground">— {liveEvent.event_name}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard title="Attendance" value={`${(liveEvent.current_attendance / 1000).toFixed(1)}K`} subtitle={`${occupancyPct}% capacity`} icon={<Users className="w-4 h-4" />} variant={occupancyPct > 85 ? 'danger' : 'default'} />
              <StatCard title="Entry Rate" value={`${entryRate}`} subtitle="per minute" icon={<TrendingUp className="w-4 h-4" />} variant="primary" />
              <StatCard title="Avg Wait" value={`${avgWaitTime.toFixed(1)}m`} subtitle={avgWaitTime > 8 ? 'Above threshold' : 'Normal'} icon={<Clock className="w-4 h-4" />} variant={avgWaitTime > 8 ? 'danger' : 'default'} />
              <StatCard title="Gates Open" value={`${Object.values(gateStatuses).filter(s => s === 'open').length}/${Object.keys(gateStatuses).length || 4}`} subtitle="active gates" icon={<DoorOpen className="w-4 h-4" />} />
            </div>
            <AttendanceTrendChart logs={logs} expectedAttendance={liveEvent.expected_attendance} />
          </>
        )}

        {!liveEvent && (
          <div className="glass rounded-xl p-6 text-center">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No live event at this stadium right now</p>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-sm">Upcoming Events ({upcomingEvents.length})</h3>
            </div>
            <div className="divide-y divide-border/10">
              {upcomingEvents.slice(0, 5).map(event => {
                const riskPct = Math.round((event.risk_score || 0) * 100);
                const riskColor = riskPct >= 80 ? 'text-destructive' : riskPct >= 60 ? 'text-neon-amber' : 'text-secondary';
                return (
                  <div key={event.id} className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors duration-200" onClick={() => navigate(`/event/${event.id}`)}>
                    <div>
                      <p className="font-medium text-sm">{event.event_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(event.event_date).toLocaleDateString()} • Expected: {(event.expected_attendance / 1000).toFixed(0)}K</p>
                    </div>
                    <span className={cn('text-xs font-semibold', riskColor)}>Risk: {riskPct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Events with Snapshot Data */}
        {completedEvents.length > 0 && (
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-display font-semibold text-sm">Past Events ({completedEvents.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider border-b border-border/20">
                    <th className="px-4 py-2">Event</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Final Attendance</th>
                    <th className="px-4 py-2">Peak</th>
                    <th className="px-4 py-2">Avg Wait</th>
                    <th className="px-4 py-2">Peak Surge</th>
                  </tr>
                </thead>
                <tbody>
                  {completedEvents.slice(0, 10).map(event => {
                    const snapshot = snapshots.find(s => s.event_id === event.id);
                    const finalAtt = snapshot?.final_attendance || event.current_attendance;
                    const peakAtt = snapshot?.peak_attendance || finalAtt;
                    const avgWait = snapshot?.avg_wait_time || 0;
                    const peakSurge = snapshot?.peak_surge_risk || 0;

                    return (
                      <tr key={event.id} className="border-b border-border/10 cursor-pointer hover:bg-muted/30 transition-colors duration-200" onClick={() => navigate(`/event/${event.id}`)}>
                        <td className="px-4 py-2.5 font-medium">{event.event_name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{new Date(event.event_date).toLocaleDateString()}</td>
                        <td className="px-4 py-2.5 font-mono">{finalAtt > 0 ? `${(finalAtt / 1000).toFixed(1)}K` : '—'}</td>
                        <td className="px-4 py-2.5 font-mono">{peakAtt > 0 ? `${(peakAtt / 1000).toFixed(1)}K` : '—'}</td>
                        <td className="px-4 py-2.5 font-mono">{avgWait > 0 ? `${avgWait.toFixed(1)}m` : '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn('font-mono font-semibold',
                            peakSurge > 0.7 ? 'text-destructive' : peakSurge > 0.4 ? 'text-neon-amber' : 'text-secondary'
                          )}>
                            {peakSurge > 0 ? `${Math.round(peakSurge * 100)}%` : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
