import React, { useState, useEffect } from 'react';
import { useStadium } from '@/contexts/StadiumContext';
import { useStadiums, useStadiumDetail } from '@/hooks/useStadiums';
import { useECIRS } from '@/hooks/useECIRS';
import { useEvacuationEngine } from '@/hooks/useEvacuationEngine';
import { useIoTSensorFusion } from '@/hooks/useIoTSensorFusion';
import { useCrowdVision } from '@/hooks/useCrowdVision';
import { useComplianceAudit } from '@/hooks/useComplianceAudit';
import { generateVenueEntities } from '@/data/venueGenerator';
import { CrowdDensity } from '@/types/stadium';
import { AdminEntityGrid } from '@/components/AdminEntityGrid';
import { AdminExecutiveSummary } from '@/components/AdminExecutiveSummary';
import { AdminSurgePrediction } from '@/components/AdminSurgePrediction';
import { AdminTrendChart } from '@/components/AdminTrendChart';
import { AttendanceTrendChart } from '@/components/AttendanceTrendChart';
import { AdminBroadcastPanel } from '@/components/AdminBroadcastPanel';
import { AdminCompliancePanel } from '@/components/AdminCompliancePanel';
import { AdminCrowdVisionPanel } from '@/components/AdminCrowdVisionPanel';
import { StadiumHeatmap } from '@/components/StadiumHeatmap';
import { useSmartAlerts } from '@/hooks/useSmartAlerts';
import { 
  Shield, AlertTriangle, Activity, LogOut, MapPin, Calendar, Siren, CheckCircle, 
  FileText, Loader2, Megaphone, Bell, CloudRain, Timer, Zap, Brain, Radio, 
  Gauge, ShieldAlert, PauseCircle, PlayCircle, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AdminPage: React.FC = () => {
  const { state, toggleEmergencyMode, addLog, logs } = useStadium();
  const { stadiums } = useStadiums();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [selectedStadiumId, setSelectedStadiumId] = useState<string | null>(null);
  const { stadium, events, logs: attendanceLogs } = useStadiumDetail(selectedStadiumId || undefined);

  const liveEvent = events.find(e => e.status === 'live');
  const upcomingEvent = events.find(e => e.status === 'upcoming');
  const activeEvent = liveEvent || upcomingEvent;
  const isPast = !liveEvent && !upcomingEvent;

  const {
    alerts, isRedAlert, incidentActive, incidentReport,
    acknowledgeAlert, resolveIncident, dismissRedAlert,
  } = useECIRS(
    attendanceLogs,
    liveEvent?.current_attendance || 0,
    liveEvent?.expected_attendance || 1,
  );

  const venueEntities = stadium
    ? generateVenueEntities(stadium.id, stadium.name, stadium.capacity)
        .filter(e => e.type !== 'seat_block' && e.type !== 'emergency_exit')
    : [];

  const allVenueEntities = stadium
    ? generateVenueEntities(stadium.id, stadium.name, stadium.capacity)
    : [];

  // Latest log metrics
  const latestLog = attendanceLogs.length > 0 ? attendanceLogs[attendanceLogs.length - 1] : null;
  const surgeRisk = latestLog?.surge_risk_score || 0;
  const entryRate = latestLog?.entry_rate || 0;
  const avgWaitTime = latestLog?.avg_wait_time || 0;
  const gateStatuses = (latestLog?.gate_statuses || {}) as Record<string, string>;
  const occupancyPct = liveEvent && stadium ? Math.round((liveEvent.current_attendance / stadium.capacity) * 100) : 0;

  // Smart alerts
  const { alerts: smartAlerts, broadcastAlert } = useSmartAlerts(
    venueEntities, surgeRisk, state.isEmergencyMode, !!liveEvent,
  );

  // Evacuation Engine + Psychology
  const { evacuationState, startEvacuation, stopEvacuation, getOptimalGateRecommendation, psychologyMetrics } = useEvacuationEngine(
    allVenueEntities,
    liveEvent?.current_attendance || 0,
    stadium?.capacity || 1,
    state.isEmergencyMode,
    liveEvent?.id,
  );

  // IoT Sensor Fusion
  const { fusedDensities, sensorHealth, simulateIoTData } = useIoTSensorFusion(selectedStadiumId || undefined);

  // CV Crowd Analytics
  const { analytics: visionAnalytics } = useCrowdVision(allVenueEntities, !!liveEvent);

  // Compliance Audit
  const { violations, metrics: complianceMetrics, resolveViolation } = useComplianceAudit(
    liveEvent?.id,
    liveEvent?.current_attendance,
    stadium?.capacity,
  );

  // Gate recommendation
  const gateRecommendation = getOptimalGateRecommendation();

  // Emergency sound
  useEffect(() => {
    if (isRedAlert) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; gain.gain.value = 0.3;
        osc.start();
        setTimeout(() => { gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5); }, 500);
        setTimeout(() => { osc.stop(); ctx.close(); }, 1500);
      } catch { /* silent */ }
    }
  }, [isRedAlert]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('Signup failed');
        const { error: roleError } = await supabase.from('user_roles').insert({ user_id: data.user.id, role: 'admin' as any } as any);
        if (roleError) {
          toast.info('Account created! Ask system admin to assign admin role.');
          setIsSignup(false); setLoginLoading(false); return;
        }
        setIsAuthenticated(true);
        addLog('Signup', `Admin account created: ${email}`);
        toast.success('Admin account created!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: roles } = await supabase
          .from('user_roles').select('role')
          .eq('user_id', data.user.id).eq('role', 'admin').single();
        if (!roles) {
          await supabase.auth.signOut();
          throw new Error('Unauthorized: Admin access required');
        }
        setIsAuthenticated(true);
        addLog('Login', `Admin logged in: ${email}`);
        toast.success('Admin access granted');
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmergencyToggle = () => {
    toggleEmergencyMode();
    addLog(
      state.isEmergencyMode ? 'Emergency Off' : 'Emergency On',
      `Emergency mode ${state.isEmergencyMode ? 'deactivated' : 'activated'} for ${stadium?.name || 'system'}`
    );
    toast[state.isEmergencyMode ? 'info' : 'warning'](
      state.isEmergencyMode ? 'Emergency mode deactivated' : '🚨 Emergency mode activated!'
    );
  };

  // Delay management
  const handleTriggerDelay = async (type: 'weather' | 'technical' | 'security') => {
    if (!liveEvent) return;
    await supabase.from('events').update({
      delay_status: type,
      is_paused: true,
      delay_started_at: new Date().toISOString(),
    } as any).eq('id', liveEvent.id);
    addLog('Delay Triggered', `${type} delay activated for ${liveEvent.event_name}`);
    toast.warning(`⛈ ${type.charAt(0).toUpperCase() + type.slice(1)} delay activated`);
  };

  const handleResumeEvent = async () => {
    if (!liveEvent) return;
    const delayMins = liveEvent.delay_started_at
      ? Math.round((Date.now() - new Date(liveEvent.delay_started_at).getTime()) / 60000)
      : 0;
    await supabase.from('events').update({
      delay_status: 'none',
      is_paused: false,
      delay_total_minutes: (liveEvent.delay_total_minutes || 0) + delayMins,
      delay_started_at: null,
    } as any).eq('id', liveEvent.id);
    addLog('Event Resumed', `${liveEvent.event_name} resumed after ${delayMins} min delay`);
    toast.success('Event resumed!');
  };

  // Overtime management
  const handleActivateOvertime = async (reason: string, minutes: number) => {
    if (!liveEvent) return;
    await supabase.from('events').update({
      overtime_active: true,
      overtime_reason: reason,
      overtime_minutes_added: (liveEvent.overtime_minutes_added || 0) + minutes,
    } as any).eq('id', liveEvent.id);
    addLog('Overtime Activated', `${reason} — ${minutes} min added for ${liveEvent.event_name}`);
    toast.info(`🔥 Overtime: +${minutes} minutes`);
  };

  const handleEndOvertime = async () => {
    if (!liveEvent) return;
    await supabase.from('events').update({
      overtime_active: false,
      overtime_reason: null,
    } as any).eq('id', liveEvent.id);
    addLog('Overtime Ended', `Overtime concluded for ${liveEvent.event_name}`);
    toast.info('Overtime ended');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass rounded-xl p-8 w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-display font-bold">{isSignup ? 'Create Admin Account' : 'Admin Access'}</h2>
            <p className="text-sm text-muted-foreground mt-1">{isSignup ? 'Create a new admin account' : 'Sign in with admin credentials'}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="text-xs font-medium text-muted-foreground">Email</label>
              <input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full mt-1 h-10 rounded-lg bg-muted/50 border border-border/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required autoComplete="email" />
            </div>
            <div>
              <label htmlFor="admin-password" className="text-xs font-medium text-muted-foreground">Password</label>
              <input id="admin-password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full mt-1 h-10 rounded-lg bg-muted/50 border border-border/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required autoComplete="current-password" />
            </div>
            {loginError && <p className="text-sm text-destructive" role="alert">{loginError}</p>}
            <button type="submit" disabled={loginLoading}
              className="w-full h-10 rounded-lg gradient-primary text-primary-foreground font-medium text-sm disabled:opacity-50 transition-opacity">
              {loginLoading ? 'Loading...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
            <button type="button" onClick={() => { setIsSignup(!isSignup); setLoginError(''); }}
              className="w-full text-sm text-primary hover:underline">
              {isSignup ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', isRedAlert && 'border-2 border-destructive rounded-xl p-2')}>
      {/* Red Alert Overlay */}
      {isRedAlert && (
        <div className="glass rounded-xl p-4 border-destructive/50 bg-destructive/10 animate-pulse" role="alert">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Siren className="w-6 h-6 text-destructive" />
              <div>
                <p className="font-bold text-destructive text-lg">🚨 CRITICAL INCIDENT DETECTED</p>
                <p className="text-sm text-muted-foreground">Extreme crowd conditions detected. Immediate action required.</p>
              </div>
            </div>
            <button onClick={dismissRedAlert} className="px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs font-medium hover:bg-destructive/30">
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">
            <span className="gradient-text">Admin Command Center</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {stadium ? `Managing: ${stadium.name}` : 'Select a stadium to manage'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={async () => {
            await supabase.auth.signOut();
            setIsAuthenticated(false); setEmail(''); setPassword('');
            toast.info('Signed out');
          }} className="px-3 py-2 rounded-lg glass text-sm font-medium flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
          <button onClick={handleEmergencyToggle}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all',
              state.isEmergencyMode
                ? 'bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30'
                : 'glass border-destructive/20 text-muted-foreground hover:text-destructive hover:border-destructive/40'
            )}>
            <AlertTriangle className="w-4 h-4" />
            {state.isEmergencyMode ? 'Deactivate Emergency' : 'Activate Emergency'}
          </button>
        </div>
      </div>

      {/* Stadium Selector */}
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <select value={selectedStadiumId || ''} onChange={e => setSelectedStadiumId(e.target.value || null)}
          className="flex-1 h-9 rounded-lg bg-muted/50 border border-border/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Select stadium">
          <option value="">Select a stadium to manage...</option>
          {stadiums.map(s => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
        </select>
      </div>

      {!stadium && (
        <div className="glass rounded-xl p-8 text-center">
          <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Select a stadium above to view and manage live operations</p>
        </div>
      )}

      {stadium && (
        <>
          {/* Active Event Info + Delay/Overtime Badges */}
          {activeEvent && (
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">{activeEvent.event_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activeEvent.event_date).toLocaleString()} • 
                      <span className={cn(
                        'ml-1 font-semibold',
                        activeEvent.status === 'live' ? 'text-secondary' : 'text-primary'
                      )}>
                        {activeEvent.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
                {liveEvent && (
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold">{(liveEvent.current_attendance / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground">{occupancyPct}% capacity</p>
                  </div>
                )}
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-2 mt-2">
                {liveEvent?.is_paused && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-neon-amber/20 text-neon-amber border border-neon-amber/30">
                    <PauseCircle className="w-3 h-3" /> PAUSED — {liveEvent.delay_status?.toUpperCase()} DELAY
                  </span>
                )}
                {liveEvent?.overtime_active && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-destructive/20 text-destructive border border-destructive/30">
                    <Zap className="w-3 h-3" /> OVERTIME — {liveEvent.overtime_reason?.replace('_', ' ').toUpperCase()}
                  </span>
                )}
                {liveEvent?.evacuation_mode && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-destructive/20 text-destructive border border-destructive/30 animate-pulse">
                    <Siren className="w-3 h-3" /> EVACUATION ACTIVE
                  </span>
                )}
                {liveEvent?.is_locked && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                    🔒 LOCKED
                  </span>
                )}
                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] bg-muted/50 text-muted-foreground">
                  Lifecycle: {(liveEvent || activeEvent)?.lifecycle_state}
                </span>
              </div>
            </div>
          )}

          {/* Delay / Overtime Controls (LIVE only) */}
          {liveEvent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Delay Controls */}
              <div className="glass rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-neon-amber" /> Match Delay Controls
                </h3>
                {liveEvent.is_paused ? (
                  <div className="space-y-2">
                    <p className="text-xs text-neon-amber">⛈ Delay active: {liveEvent.delay_status}</p>
                    {liveEvent.delay_started_at && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Duration: {Math.round((Date.now() - new Date(liveEvent.delay_started_at).getTime()) / 60000)} min
                      </p>
                    )}
                    <button onClick={handleResumeEvent}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary/20 text-secondary text-xs font-medium hover:bg-secondary/30">
                      <PlayCircle className="w-4 h-4" /> Resume Event
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {(['weather', 'technical', 'security'] as const).map(type => (
                      <button key={type} onClick={() => handleTriggerDelay(type)}
                        className="px-2 py-1.5 rounded-lg glass text-xs font-medium hover:bg-neon-amber/10 hover:text-neon-amber transition-colors">
                        {type === 'weather' ? '⛈' : type === 'technical' ? '🔧' : '🔒'} {type}
                      </button>
                    ))}
                  </div>
                )}
                {liveEvent.delay_total_minutes > 0 && (
                  <p className="text-[10px] text-muted-foreground">Total delay accumulated: {liveEvent.delay_total_minutes} min</p>
                )}
              </div>

              {/* Overtime Controls */}
              <div className="glass rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Timer className="w-4 h-4 text-destructive" /> Overtime Controls
                </h3>
                {liveEvent.overtime_active ? (
                  <div className="space-y-2">
                    <p className="text-xs text-destructive">🔥 Overtime: {liveEvent.overtime_reason?.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground font-mono">+{liveEvent.overtime_minutes_added} min added</p>
                    <button onClick={handleEndOvertime}
                      className="w-full px-3 py-2 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80">
                      End Overtime
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => handleActivateOvertime('super_over', 30)}
                        className="px-2 py-1.5 rounded-lg glass text-xs font-medium hover:bg-destructive/10 hover:text-destructive transition-colors">
                        ⚡ Super Over
                      </button>
                      <button onClick={() => handleActivateOvertime('tie_break', 20)}
                        className="px-2 py-1.5 rounded-lg glass text-xs font-medium hover:bg-destructive/10 hover:text-destructive transition-colors">
                        🏏 Tie Break
                      </button>
                      <button onClick={() => handleActivateOvertime('ceremony_extension', 45)}
                        className="px-2 py-1.5 rounded-lg glass text-xs font-medium hover:bg-destructive/10 hover:text-destructive transition-colors">
                        🎉 Ceremony
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Evacuation Panel (LIVE only) */}
          {liveEvent && (
            <div className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-destructive" /> Evacuation Control
                </h3>
                {!evacuationState.isActive ? (
                  <button onClick={startEvacuation}
                    className="px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs font-medium hover:bg-destructive/30">
                    Start Evacuation Sim
                  </button>
                ) : (
                  <button onClick={stopEvacuation}
                    className="px-3 py-1.5 rounded-lg bg-secondary/20 text-secondary text-xs font-medium hover:bg-secondary/30">
                    Stop Evacuation
                  </button>
                )}
              </div>
              {evacuationState.isActive && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div><p className="font-mono text-lg font-bold text-destructive">{evacuationState.totalRemaining.toLocaleString()}</p><p className="text-muted-foreground">Remaining</p></div>
                    <div><p className="font-mono text-lg font-bold text-neon-amber">{evacuationState.zones.length}</p><p className="text-muted-foreground">Exit Zones</p></div>
                    <div><p className="font-mono text-lg font-bold text-primary">{Math.max(...evacuationState.zones.map(z => z.estimatedClearTime))}m</p><p className="text-muted-foreground">Est. Clear</p></div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase">Exit Distribution</p>
                    {Object.entries(evacuationState.exitDistribution).map(([gate, pct]) => (
                      <div key={gate} className="flex items-center gap-2">
                        <span className="text-xs w-24 truncate">{gate}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-mono w-8 text-right">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Psychology Metrics (LIVE only) */}
          {liveEvent && (
            <div className="glass rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" /> Crowd Psychology Risk Model
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Panic Index', value: psychologyMetrics.panicIndex, color: psychologyMetrics.panicIndex > 70 ? 'text-destructive' : psychologyMetrics.panicIndex > 40 ? 'text-neon-amber' : 'text-secondary' },
                  { label: 'Aggression Index', value: psychologyMetrics.aggressionIndex, color: psychologyMetrics.aggressionIndex > 60 ? 'text-destructive' : 'text-neon-amber' },
                  { label: 'Density Stress', value: psychologyMetrics.densityStressScore, color: psychologyMetrics.densityStressScore > 70 ? 'text-destructive' : 'text-secondary' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className={cn('text-2xl font-bold font-mono', m.color)}>{m.value}%</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                    <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', 
                        m.value > 70 ? 'bg-destructive' : m.value > 40 ? 'bg-neon-amber' : 'bg-secondary'
                      )} style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {psychologyMetrics.panicIndex > 70 && (
                <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-2 border border-destructive/20">
                  ⚠ Panic threshold exceeded. Consider: opening secondary exits, calming announcements, deploying crowd marshals.
                </div>
              )}
            </div>
          )}

          {/* Gate Entry Flow Balancing */}
          {liveEvent && gateRecommendation && (
            <div className="glass rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Gauge className="w-4 h-4 text-primary" /> Entry Flow Balancing
              </h3>
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div>
                  <p className="text-lg font-bold text-primary font-mono">{gateRecommendation.entryEfficiency}%</p>
                  <p className="text-muted-foreground">Entry Efficiency</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-secondary font-mono">{gateRecommendation.recommended.gate.name}</p>
                  <p className="text-muted-foreground">Recommended Gate</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Gate Load Balance</p>
                {gateRecommendation.loadBalance.map(g => (
                  <div key={g.name} className="flex items-center gap-2">
                    <span className="text-xs w-20 truncate">{g.name}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full',
                        g.loadPct > 80 ? 'bg-destructive' : g.loadPct > 50 ? 'bg-neon-amber' : 'bg-secondary'
                      )} style={{ width: `${g.loadPct}%` }} />
                    </div>
                    <span className="text-xs font-mono w-8 text-right">{g.loadPct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IoT Sensor Panel */}
          {liveEvent && (
            <div className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary" /> IoT Sensor Fusion
                </h3>
                <button onClick={simulateIoTData}
                  className="px-2 py-1 rounded-lg glass text-[10px] font-medium text-primary hover:bg-primary/10">
                  Simulate Sensors
                </button>
              </div>
              {fusedDensities.length > 0 ? (
                <div className="space-y-2">
                  {fusedDensities.map(fd => (
                    <div key={fd.zoneId} className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
                      <div>
                        <p className="text-xs font-medium">{fd.zoneId.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-muted-foreground">Confidence: {(fd.confidence * 100).toFixed(0)}%</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-bold',
                          fd.level === 'high' ? 'text-destructive' : fd.level === 'medium' ? 'text-neon-amber' : 'text-secondary'
                        )}>
                          {fd.finalScore}% — {fd.level.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">No sensor data. Click "Simulate Sensors" to generate.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {Object.entries(sensorHealth).map(([type, healthy]) => (
                  <span key={type} className={cn('text-[10px] px-2 py-0.5 rounded-full',
                    healthy ? 'bg-secondary/10 text-secondary' : 'bg-destructive/10 text-destructive'
                  )}>
                    {healthy ? '✓' : '✗'} {type.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CV Crowd Analytics (LIVE only) */}
          {liveEvent && <AdminCrowdVisionPanel analytics={visionAnalytics} />}

          {/* Compliance Panel (LIVE only) */}
          {liveEvent && (
            <AdminCompliancePanel metrics={complianceMetrics} violations={violations} onResolve={resolveViolation} />
          )}

          {/* Stadium Digital Twin Heatmap */}
          {liveEvent && allVenueEntities.length > 0 && (
            <StadiumHeatmap entities={allVenueEntities} currentAttendance={liveEvent.current_attendance} capacity={stadium.capacity} />
          )}

          {isPast && (
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">No live or upcoming events. Historical data is read-only.</p>
            </div>
          )}

          {/* Executive Summary (LIVE only) */}
          {liveEvent && (
            <AdminExecutiveSummary
              entities={venueEntities}
              currentAttendance={liveEvent.current_attendance}
              capacity={stadium.capacity}
              surgeRisk={surgeRisk}
              avgWaitTime={avgWaitTime}
              entryRate={entryRate}
            />
          )}

          {/* Surge Prediction Panel (LIVE only) */}
          {liveEvent && (
            <AdminSurgePrediction
              surgeRisk={surgeRisk}
              entryRate={entryRate}
              avgWaitTime={avgWaitTime}
              occupancyPct={occupancyPct}
              gateStatuses={gateStatuses}
              capacity={stadium.capacity}
              currentAttendance={liveEvent.current_attendance}
            />
          )}

          {/* Trend Charts (LIVE only) */}
          {liveEvent && attendanceLogs.length > 0 && (
            <>
              <AdminTrendChart logs={attendanceLogs} />
              <AttendanceTrendChart logs={attendanceLogs} expectedAttendance={liveEvent.expected_attendance} />
            </>
          )}

          {/* ECIRS Alerts */}
          {alerts.filter(a => !a.acknowledged).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Siren className="w-4 h-4 text-destructive" /> Active Alerts ({alerts.filter(a => !a.acknowledged).length})
              </h3>
              {alerts.filter(a => !a.acknowledged).slice(0, 5).map(alert => (
                <div key={alert.id} className={cn(
                  'glass rounded-xl p-3 border',
                  alert.severity === 'critical' ? 'border-destructive/50 bg-destructive/5' : 'border-neon-amber/50 bg-neon-amber/5'
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={cn('text-xs font-bold uppercase',
                        alert.severity === 'critical' ? 'text-destructive' : 'text-neon-amber'
                      )}>{alert.severity} — {alert.timestamp.toLocaleTimeString()}</p>
                      <p className="text-sm mt-1">{alert.message}</p>
                      {alert.recommendations.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] uppercase text-muted-foreground font-semibold">Recommendations:</p>
                          {alert.recommendations.map((r, i) => (
                            <p key={i} className="text-xs text-muted-foreground">• {r}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => acknowledgeAlert(alert.id)}
                      className="px-2 py-1 rounded-lg bg-secondary/20 text-secondary text-xs font-medium hover:bg-secondary/30 shrink-0">
                      <CheckCircle className="w-3 h-3 inline mr-1" />Ack
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Incident Report */}
          {incidentActive && (
            <div className="glass rounded-xl p-4 border border-destructive/30">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <Siren className="w-4 h-4" /> Incident In Progress
                </p>
                <button onClick={resolveIncident}
                  className="px-3 py-1.5 rounded-lg bg-secondary/20 text-secondary text-xs font-medium hover:bg-secondary/30">
                  Resolve Incident
                </button>
              </div>
            </div>
          )}

          {incidentReport && !incidentActive && (
            <div className="glass rounded-xl p-4 border border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Incident Report</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Duration:</span><p className="font-mono">{incidentReport.duration}</p></div>
                <div><span className="text-muted-foreground text-xs">Peak Density:</span><p className="font-mono">{incidentReport.peakDensity}%</p></div>
                <div><span className="text-muted-foreground text-xs">Max Wait:</span><p className="font-mono">{incidentReport.maxWaitTime.toFixed(1)} min</p></div>
                <div><span className="text-muted-foreground text-xs">Actions:</span><p className="font-mono">{incidentReport.actionsTaken.length}</p></div>
              </div>
            </div>
          )}

          {/* Admin Broadcast Panel (LIVE only) */}
          {liveEvent && (
            <AdminBroadcastPanel onBroadcast={broadcastAlert} />
          )}

          {/* Notification Stats */}
          {smartAlerts.length > 0 && (
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Alert Analytics</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div>
                  <p className="font-mono text-lg font-bold text-foreground">{smartAlerts.length}</p>
                  <p className="text-muted-foreground">Total Alerts</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-bold text-destructive">
                    {smartAlerts.filter(a => a.severity === 'critical').length}
                  </p>
                  <p className="text-muted-foreground">Critical</p>
                </div>
                <div>
                  <p className="font-mono text-lg font-bold text-neon-amber">
                    {smartAlerts.filter(a => a.severity === 'warning').length}
                  </p>
                  <p className="text-muted-foreground">Warnings</p>
                </div>
              </div>
            </div>
          )}

          {liveEvent && venueEntities.length > 0 && (
            <>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Live Venue Entities ({venueEntities.length})
              </h3>
              <AdminEntityGrid entities={venueEntities} isLive={true} />
            </>
          )}

          {/* Upcoming event config */}
          {!liveEvent && upcomingEvent && (
            <div className="glass rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-2">Upcoming Event Configuration</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Expected Attendance</span><p className="font-mono">{(upcomingEvent.expected_attendance / 1000).toFixed(0)}K</p></div>
                <div><span className="text-muted-foreground text-xs">Risk Score</span><p className="font-mono">{Math.round((upcomingEvent.risk_score || 0) * 100)}%</p></div>
                <div><span className="text-muted-foreground text-xs">Event Date</span><p className="font-mono">{new Date(upcomingEvent.event_date).toLocaleDateString()}</p></div>
                <div><span className="text-muted-foreground text-xs">Venue Entities</span><p className="font-mono">{venueEntities.length} configured</p></div>
              </div>
            </div>
          )}

          {/* Events List */}
          {events.length > 0 && (
            <div className="glass rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">All Events ({events.length})</h3>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-border/10">
                {events.map(event => (
                  <div key={event.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-sm">{event.event_name}</p>
                      <p className="text-muted-foreground">{new Date(event.event_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.is_paused && <span className="text-[10px] text-neon-amber">⛈ DELAYED</span>}
                      {event.overtime_active && <span className="text-[10px] text-destructive">🔥 OT</span>}
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                        event.status === 'live' ? 'bg-secondary/20 text-secondary' :
                        event.status === 'upcoming' ? 'bg-primary/20 text-primary' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Activity Logs */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Activity Log</h3>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No activity yet</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="px-4 py-2 border-b border-border/10 text-xs flex items-center gap-3">
                <time className="text-muted-foreground font-mono shrink-0">{log.timestamp.toLocaleTimeString()}</time>
                <span className="font-medium text-primary">{log.action}</span>
                <span className="text-muted-foreground truncate">{log.details}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
