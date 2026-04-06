import React, { useState } from 'react';
import { useStadium } from '@/contexts/StadiumContext';
import { CrowdBadge } from '@/components/CrowdBadge';
import { CrowdDensity, VenueEntity } from '@/types/stadium';
import { Shield, AlertTriangle, Save, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const AdminPage: React.FC = () => {
  const { state, updateEntity, toggleEmergencyMode, addLog, logs } = useStadium();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('Signup failed');
        
        // Auto-assign admin role for first signup
        const { error: roleError } = await supabase.from('user_roles').insert({ user_id: data.user.id, role: 'admin' as any } as any);
        if (roleError) {
          // Role insert may fail due to RLS - that's expected for first admin bootstrap
          // We'll handle this via direct DB insert
          toast.info('Account created! Ask system admin to assign admin role, or sign in if already assigned.');
          setIsSignup(false);
          setLoginLoading(false);
          return;
        }

        setIsAuthenticated(true);
        addLog('Signup', `Admin account created: ${email}`);
        toast.success('Admin account created and access granted!');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Check admin role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'admin')
          .single();

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

  const handleUpdateEntity = (id: string, updates: Partial<VenueEntity>) => {
    updateEntity(id, updates);
    const entity = state.entities.find(e => e.id === id);
    addLog('Update', `Updated ${entity?.name}: ${JSON.stringify(updates)}`);
    toast.success(`Updated ${entity?.name}`);
  };

  const handleEmergencyToggle = () => {
    toggleEmergencyMode();
    addLog(
      state.isEmergencyMode ? 'Emergency Off' : 'Emergency On',
      `Emergency mode ${state.isEmergencyMode ? 'deactivated' : 'activated'}`
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
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full mt-1 h-10 rounded-lg bg-muted/50 border border-border/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="text-xs font-medium text-muted-foreground">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full mt-1 h-10 rounded-lg bg-muted/50 border border-border/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
                autoComplete="current-password"
              />
            </div>
            {loginError && (
              <p className="text-sm text-destructive" role="alert">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full h-10 rounded-lg gradient-primary text-primary-foreground font-medium text-sm disabled:opacity-50 transition-opacity"
            >
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">
            <span className="gradient-text">Admin Dashboard</span>
          </h2>
          <p className="text-sm text-muted-foreground">Manage venue entities and system state</p>
        </div>
        <button
          onClick={handleEmergencyToggle}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all',
            state.isEmergencyMode
              ? 'bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30'
              : 'glass border-destructive/20 text-muted-foreground hover:text-destructive hover:border-destructive/40'
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          {state.isEmergencyMode ? 'Deactivate Emergency' : 'Activate Emergency'}
        </button>
      </div>

      {/* Entity Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {state.entities
          .filter(e => e.type !== 'seat_block' && e.type !== 'emergency_exit')
          .map(entity => (
            <div key={entity.id} className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{entity.name}</h4>
                <CrowdBadge density={entity.crowdDensity} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase">Crowd Density</label>
                  <select
                    value={entity.crowdDensity}
                    onChange={e => handleUpdateEntity(entity.id, { crowdDensity: e.target.value as CrowdDensity })}
                    className="w-full mt-1 h-8 rounded-md bg-muted/50 border border-border/50 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                    aria-label={`${entity.name} crowd density`}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase">Wait (min)</label>
                  <input
                    type="number"
                    value={entity.estimatedWaitTime}
                    onChange={e => handleUpdateEntity(entity.id, { estimatedWaitTime: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full mt-1 h-8 rounded-md bg-muted/50 border border-border/50 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                    min={0}
                    max={120}
                    aria-label={`${entity.name} wait time`}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Available</label>
                <button
                  onClick={() => handleUpdateEntity(entity.id, { isAvailable: !entity.isAvailable })}
                  className={cn(
                    'w-10 h-5 rounded-full transition-colors relative',
                    entity.isAvailable ? 'bg-secondary' : 'bg-muted'
                  )}
                  role="switch"
                  aria-checked={entity.isAvailable}
                  aria-label={`Toggle ${entity.name} availability`}
                >
                  <span className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform',
                    entity.isAvailable ? 'left-5' : 'left-0.5'
                  )} />
                </button>
              </div>
            </div>
          ))}
      </div>

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
                <time className="text-muted-foreground font-mono shrink-0">
                  {log.timestamp.toLocaleTimeString()}
                </time>
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
