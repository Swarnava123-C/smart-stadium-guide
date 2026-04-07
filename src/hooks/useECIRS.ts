import { useState, useEffect, useRef, useCallback } from 'react';
import { AttendanceLog } from './useStadiums';

export interface ECIRSAlert {
  id: string;
  severity: 'warning' | 'critical';
  message: string;
  affectedZones: string[];
  timestamp: Date;
  acknowledged: boolean;
  recommendations: string[];
}

export interface IncidentReport {
  startTime: Date;
  endTime: Date | null;
  duration: string;
  peakDensity: number;
  maxWaitTime: number;
  actionsTaken: string[];
}

interface ECIRSConfig {
  densityThreshold: number;       // 0.95
  entryRateSpikePercent: number;  // 50% increase
  waitTimeThreshold: number;      // 15 min
  windowSeconds: number;          // 120 (2 min)
}

const DEFAULT_CONFIG: ECIRSConfig = {
  densityThreshold: 0.95,
  entryRateSpikePercent: 50,
  waitTimeThreshold: 15,
  windowSeconds: 120,
};

export function useECIRS(logs: AttendanceLog[], currentAttendance: number, expectedAttendance: number) {
  const [alerts, setAlerts] = useState<ECIRSAlert[]>([]);
  const [isRedAlert, setIsRedAlert] = useState(false);
  const [incidentActive, setIncidentActive] = useState(false);
  const [incidentReport, setIncidentReport] = useState<IncidentReport | null>(null);
  const incidentStartRef = useRef<Date | null>(null);
  const prevEntryRateRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const checkForCriticalConditions = useCallback(() => {
    if (logs.length < 2) return;

    const latest = logs[logs.length - 1];
    const previous = logs.length >= 2 ? logs[logs.length - 2] : null;

    const densityRatio = currentAttendance / expectedAttendance;
    const entryRate = latest.entry_rate;
    const prevRate = previous?.entry_rate || prevEntryRateRef.current;
    const rateIncrease = prevRate > 0 ? ((entryRate - prevRate) / prevRate) * 100 : 0;
    const waitTime = latest.avg_wait_time;
    const surgeRisk = latest.surge_risk_score;
    const gateStatuses = latest.gate_statuses as Record<string, string>;
    const openGates = Object.values(gateStatuses).filter(s => s === 'open').length;
    const totalGates = Object.keys(gateStatuses).length || 4;

    prevEntryRateRef.current = entryRate;

    const criticalConditions: string[] = [];
    const affectedZones: string[] = [];
    const recommendations: string[] = [];

    // Check stampede risk conditions
    if (densityRatio > DEFAULT_CONFIG.densityThreshold) {
      criticalConditions.push(`Crowd density at ${Math.round(densityRatio * 100)}% — exceeds safe threshold`);
      affectedZones.push('Main arena');
    }

    if (rateIncrease > DEFAULT_CONFIG.entryRateSpikePercent) {
      criticalConditions.push(`Entry rate surged ${Math.round(rateIncrease)}% in last interval`);
      affectedZones.push('Entry gates');
    }

    if (waitTime > DEFAULT_CONFIG.waitTimeThreshold) {
      criticalConditions.push(`Average wait time ${waitTime.toFixed(1)} min — critical`);
    }

    if (openGates < totalGates * 0.5 && densityRatio > 0.8) {
      criticalConditions.push(`Only ${openGates}/${totalGates} gates open during high density`);
      recommendations.push(`Open all ${totalGates} gates immediately`);
    }

    // Generate recommendations
    if (densityRatio > DEFAULT_CONFIG.densityThreshold) {
      recommendations.push('Activate emergency crowd dispersal protocol');
      recommendations.push('Deploy emergency staff to high-density zones');
      recommendations.push('Activate public announcement system');
    }

    if (rateIncrease > DEFAULT_CONFIG.entryRateSpikePercent) {
      recommendations.push('Temporarily halt entry at congested gates');
      recommendations.push('Redirect incoming crowd to alternate entry points');
    }

    if (surgeRisk > 0.85) {
      recommendations.push('Flash evacuation exits on venue displays');
      recommendations.push('Prepare medical response teams');
    }

    const isCritical = criticalConditions.length >= 2 || densityRatio > 0.98;
    const isWarning = criticalConditions.length >= 1;

    if (isCritical || isWarning) {
      const newAlert: ECIRSAlert = {
        id: crypto.randomUUID(),
        severity: isCritical ? 'critical' : 'warning',
        message: criticalConditions.join('. '),
        affectedZones,
        timestamp: new Date(),
        acknowledged: false,
        recommendations,
      };

      setAlerts(prev => {
        // Debounce: don't add if same severity alert within last 30 seconds
        const recent = prev.find(a => 
          a.severity === newAlert.severity && 
          (Date.now() - a.timestamp.getTime()) < 30000
        );
        if (recent) return prev;
        return [newAlert, ...prev].slice(0, 50);
      });

      if (isCritical) {
        setIsRedAlert(true);
        if (!incidentActive) {
          setIncidentActive(true);
          incidentStartRef.current = new Date();
        }
      }
    }
  }, [logs, currentAttendance, expectedAttendance, incidentActive]);

  useEffect(() => {
    checkForCriticalConditions();
  }, [checkForCriticalConditions]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
  }, []);

  const resolveIncident = useCallback(() => {
    if (!incidentStartRef.current) return;

    const latest = logs[logs.length - 1];
    setIncidentReport({
      startTime: incidentStartRef.current,
      endTime: new Date(),
      duration: `${Math.round((Date.now() - incidentStartRef.current.getTime()) / 60000)} minutes`,
      peakDensity: Math.round((currentAttendance / expectedAttendance) * 100),
      maxWaitTime: latest?.avg_wait_time || 0,
      actionsTaken: alerts.filter(a => a.acknowledged).map(a => `Acknowledged: ${a.message}`),
    });

    setIsRedAlert(false);
    setIncidentActive(false);
    incidentStartRef.current = null;
  }, [logs, currentAttendance, expectedAttendance, alerts]);

  const dismissRedAlert = useCallback(() => {
    setIsRedAlert(false);
  }, []);

  return {
    alerts,
    isRedAlert,
    incidentActive,
    incidentReport,
    acknowledgeAlert,
    resolveIncident,
    dismissRedAlert,
  };
}
