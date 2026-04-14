import React, { useMemo } from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  MapPin, MessageSquare, Map, Shield, AlertTriangle,
  Menu, X, Globe, BookOpen
} from 'lucide-react';
import { useStadium } from '@/contexts/StadiumContext';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useSmartAlerts } from '@/hooks/useSmartAlerts';

const navItems = [
  { to: '/', icon: MapPin, label: 'Stadiums' },
  { to: '/assistant', icon: MessageSquare, label: 'AI Assistant' },
  { to: '/venue-map', icon: Map, label: 'Venue Map' },
  { to: '/admin', icon: Shield, label: 'Admin' },
  { to: '/national', icon: Globe, label: 'Command Center' },
  { to: '/architecture', icon: BookOpen, label: 'Architecture' },
];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useStadium();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Smart alerts for public-facing notifications
  const { alerts, unreadCount, markRead, markAllRead, clearAlerts } = useSmartAlerts(
    state.entities,
    0, // surge risk from context
    state.isEmergencyMode,
    true, // treat as live for demo
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Emergency Public Banner */}
      {state.isEmergencyMode && (
        <div className="bg-destructive/90 text-destructive-foreground px-4 py-2 text-center text-sm font-medium z-[60] relative">
          <span className="mr-2">🚨</span>
          Emergency alert active. Please remain calm and proceed to the nearest exit. Follow on-screen directions.
        </div>
      )}

      {/* Top Bar */}
      <header className="h-14 glass-strong border-b border-border/30 flex items-center px-4 gap-4 z-50 sticky top-0">
        <button
          className="md:hidden p-1.5 rounded-md hover:bg-muted"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">AF</span>
          </div>
          <h1 className="font-display font-bold text-lg hidden sm:block">
            <span className="gradient-text">ArenaFlow</span>{' '}
            <span className="text-muted-foreground font-normal">AI</span>
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Notification Center */}
          <NotificationCenter
            alerts={alerts}
            unreadCount={unreadCount}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onClear={clearAlerts}
          />

          <div className="text-xs text-muted-foreground hidden sm:block">
            National Stadium Intelligence
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav
          className={cn(
            "w-56 glass border-r border-border/30 p-3 flex flex-col gap-1 transition-transform duration-300 z-40",
            "fixed md:sticky top-14 bottom-0 left-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
          role="navigation"
          aria-label="Main navigation"
        >
          {navItems.map(({ to, icon: Icon, label }) => (
            <RouterNavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary neon-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )
              }
              end={to === '/'}
            >
              <Icon className="w-4 h-4" />
              {label}
            </RouterNavLink>
          ))}
        </nav>

        {/* Overlay for mobile */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-background/60 z-30 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto" role="main">
          {children}
        </main>
      </div>
    </div>
  );
};
