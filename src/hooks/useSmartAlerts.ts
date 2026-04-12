import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { VenueEntity } from '@/types/stadium';

export interface SmartAlert {
  id: string;
  type: 'gate_congestion' | 'food_queue' | 'surge_detected' | 'route_blocked' | 'emergency' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  suggestion?: string;
  zone?: string;
  timestamp: Date;
  read: boolean;
  cooldownKey: string;
}

interface AlertConfig {
  gateWaitThreshold: number;   // minutes
  foodQueueThreshold: number;  // crowd density
  surgeRiskThreshold: number;  // 0-1
  cooldownMinutes: number;     // per alert type
  enabled: boolean;
}

const DEFAULT_CONFIG: AlertConfig = {
  gateWaitThreshold: 12,
  foodQueueThreshold: 0.8,
  surgeRiskThreshold: 0.7,
  cooldownMinutes: 5,
  enabled: true,
};

export function useSmartAlerts(
  entities: VenueEntity[],
  surgeRisk: number,
  isEmergencyMode: boolean,
  isLive: boolean,
) {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [config, setConfig] = useState<AlertConfig>(DEFAULT_CONFIG);
  const [unreadCount, setUnreadCount] = useState(0);
  const cooldownMapRef = useRef<Map<string, number>>(new Map());

  const canAlert = useCallback((key: string): boolean => {
    const lastTime = cooldownMapRef.current.get(key);
    if (!lastTime) return true;
    return Date.now() - lastTime > config.cooldownMinutes * 60000;
  }, [config.cooldownMinutes]);

  const pushAlert = useCallback((alert: Omit<SmartAlert, 'id' | 'timestamp' | 'read'>) => {
    if (!canAlert(alert.cooldownKey)) return;
    
    cooldownMapRef.current.set(alert.cooldownKey, Date.now());
    
    const newAlert: SmartAlert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };

    setAlerts(prev => [newAlert, ...prev].slice(0, 100));
    setUnreadCount(prev => prev + 1);

    // Show toast based on severity
    if (alert.severity === 'critical') {
      toast.error(alert.title, { description: alert.message, duration: 8000 });
    } else if (alert.severity === 'warning') {
      toast.warning(alert.title, { description: alert.message, duration: 6000 });
    } else {
      toast.info(alert.title, { description: alert.message, duration: 4000 });
    }
  }, [canAlert]);

  // Check conditions every 10 seconds
  useEffect(() => {
    if (!config.enabled || !isLive || entities.length === 0) return;

    const check = () => {
      // Gate congestion alerts
      const gates = entities.filter(e => e.type === 'gate');
      const congestedGates = gates.filter(e => e.estimatedWaitTime > config.gateWaitThreshold);
      const bestGate = gates.reduce((best, g) => 
        g.estimatedWaitTime < best.estimatedWaitTime ? g : best, gates[0]);
      
      congestedGates.forEach(gate => {
        if (bestGate && bestGate.id !== gate.id) {
          pushAlert({
            type: 'gate_congestion',
            severity: gate.estimatedWaitTime > 20 ? 'critical' : 'warning',
            title: `${gate.name} congestion rising`,
            message: `Wait time: ${gate.estimatedWaitTime} min`,
            suggestion: `Consider ${bestGate.name} (${bestGate.estimatedWaitTime} min wait)`,
            zone: gate.name,
            cooldownKey: `gate-${gate.id}`,
          });
        }
      });

      // Food queue alerts
      const foods = entities.filter(e => e.type === 'food_stall');
      foods.forEach(food => {
        if (food.crowdDensity === 'high' && food.capacity && food.currentOccupancy) {
          const ratio = food.currentOccupancy / food.capacity;
          if (ratio > config.foodQueueThreshold) {
            const bestFood = foods.reduce((best, f) => 
              f.estimatedWaitTime < best.estimatedWaitTime ? f : best, foods[0]);
            pushAlert({
              type: 'food_queue',
              severity: 'warning',
              title: `${food.name} experiencing high wait`,
              message: `Wait: ${food.estimatedWaitTime} min, Crowd: ${food.crowdDensity}`,
              suggestion: bestFood.id !== food.id ? `${bestFood.name} available nearby (${bestFood.estimatedWaitTime} min)` : undefined,
              zone: food.name,
              cooldownKey: `food-${food.id}`,
            });
          }
        }
      });

      // Surge risk alert
      if (surgeRisk > config.surgeRiskThreshold) {
        pushAlert({
          type: 'surge_detected',
          severity: surgeRisk > 0.85 ? 'critical' : 'warning',
          title: `Crowd surge detected — ${Math.round(surgeRisk * 100)}% risk`,
          message: 'Sudden increase in crowd density detected in multiple zones',
          suggestion: 'Alternate routes and exits are being calculated',
          cooldownKey: 'surge-general',
        });
      }
    };

    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [entities, surgeRisk, isLive, config, pushAlert]);

  // Emergency override
  useEffect(() => {
    if (isEmergencyMode) {
      pushAlert({
        type: 'emergency',
        severity: 'critical',
        title: '🚨 Emergency Alert Active',
        message: 'Please proceed calmly to the nearest safe exit. Follow on-screen directions.',
        suggestion: 'Emergency exits highlighted on venue map',
        cooldownKey: 'emergency-main',
      });
    }
  }, [isEmergencyMode, pushAlert]);

  const markRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setUnreadCount(0);
  }, []);

  // Admin broadcast
  const broadcastAlert = useCallback((title: string, message: string, severity: SmartAlert['severity'] = 'warning') => {
    pushAlert({
      type: 'recommendation',
      severity,
      title,
      message,
      cooldownKey: `broadcast-${Date.now()}`,
    });
  }, [pushAlert]);

  return {
    alerts,
    unreadCount,
    config,
    setConfig,
    markRead,
    markAllRead,
    clearAlerts,
    broadcastAlert,
  };
}
