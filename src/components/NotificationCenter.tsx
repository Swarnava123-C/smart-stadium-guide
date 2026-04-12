import React, { useState } from 'react';
import { Bell, X, CheckCheck, AlertTriangle, Info, Siren, Navigation, Utensils } from 'lucide-react';
import { SmartAlert } from '@/hooks/useSmartAlerts';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  alerts: SmartAlert[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClear: () => void;
}

const alertIcons: Record<SmartAlert['type'], React.ReactNode> = {
  gate_congestion: <Navigation className="w-3.5 h-3.5" />,
  food_queue: <Utensils className="w-3.5 h-3.5" />,
  surge_detected: <AlertTriangle className="w-3.5 h-3.5" />,
  route_blocked: <Navigation className="w-3.5 h-3.5" />,
  emergency: <Siren className="w-3.5 h-3.5" />,
  recommendation: <Info className="w-3.5 h-3.5" />,
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  alerts, unreadCount, onMarkRead, onMarkAllRead, onClear,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg glass hover:bg-muted/50 transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 max-h-96 glass rounded-xl border border-border/50 shadow-xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="px-3 py-2.5 border-b border-border/30 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notifications {alerts.length > 0 && `(${alerts.length})`}
              </h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={onMarkAllRead} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
                {alerts.length > 0 && (
                  <button onClick={onClear} className="ml-2 text-[10px] text-muted-foreground hover:text-foreground">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Alerts */}
            <div className="max-h-72 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                alerts.slice(0, 20).map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => onMarkRead(alert.id)}
                    className={cn(
                      'px-3 py-2.5 border-b border-border/10 cursor-pointer hover:bg-muted/30 transition-colors',
                      !alert.read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        'mt-0.5 p-1 rounded shrink-0',
                        alert.severity === 'critical' ? 'bg-destructive/20 text-destructive' :
                        alert.severity === 'warning' ? 'bg-neon-amber/20 text-neon-amber' :
                        'bg-primary/20 text-primary'
                      )}>
                        {alertIcons[alert.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs font-medium', !alert.read && 'text-foreground')}>
                          {alert.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                          {alert.message}
                        </p>
                        {alert.suggestion && (
                          <p className="text-[10px] text-primary mt-0.5">
                            💡 {alert.suggestion}
                          </p>
                        )}
                        <time className="text-[9px] text-muted-foreground mt-1 block">
                          {alert.timestamp.toLocaleTimeString()}
                        </time>
                      </div>
                      {!alert.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
