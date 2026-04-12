import React, { useState, useEffect } from 'react';
import { useStadium } from '@/contexts/StadiumContext';
import { useStadiums, useStadiumDetail } from '@/hooks/useStadiums';
import { useECIRS } from '@/hooks/useECIRS';
import { generateVenueEntities } from '@/data/venueGenerator';
import { CrowdDensity } from '@/types/stadium';
import { AdminEntityGrid } from '@/components/AdminEntityGrid';
import { AdminExecutiveSummary } from '@/components/AdminExecutiveSummary';
import { AdminSurgePrediction } from '@/components/AdminSurgePrediction';
import { AdminTrendChart } from '@/components/AdminTrendChart';
import { AttendanceTrendChart } from '@/components/AttendanceTrendChart';
import { AdminBroadcastPanel } from '@/components/AdminBroadcastPanel';
import { useSmartAlerts } from '@/hooks/useSmartAlerts';
import { Shield, AlertTriangle, Activity, LogOut, MapPin, Calendar, Siren, CheckCircle, FileText, Loader2, Megaphone, Bell } from 'lucide-react';
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

  // Latest log metrics
  const latestLog = attendanceLogs.length > 0 ? attendanceLogs[attendanceLogs.length - 1] : null;
  const surgeRisk = latestLog?.surge_risk_score || 0;
  const entryRate = latestLog?.entry_rate || 0;
  const avgWaitTime = latestLog?.avg_wait_time || 0;
  const gateStatuses = (latestLog?.gate_statuses || {}) as Record<string, string>;
  const occupancyPct = liveEvent && stadium ? Math.round((liveEvent.current_attendance / stadium.capacity) * 100) : 0;

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
          {/* Active Event Info */}
          {activeEvent && (
            <div className="glass rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">{activeEvent.event_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activeEvent.event_date).toLocaleString()} • {activeEvent.status.toUpperCase()}
                  </p>
                </div>
              </div>
              {liveEvent && (
                <div className="text-right">
                  <p className="text-sm font-mono font-bold">{(liveEvent.current_attendance / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-muted-foreground">{occupancyPct}% capacity</p>
                </div>
              )}
              {!liveEvent && upcomingEvent && (
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Upcoming</span>
              )}
            </div>
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

          {/* Venue Entity Controls */}
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
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                      event.status === 'live' ? 'bg-secondary/20 text-secondary' :
                      event.status === 'upcoming' ? 'bg-primary/20 text-primary' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {event.status}
                    </span>
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
