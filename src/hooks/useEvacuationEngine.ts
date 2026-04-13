import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VenueEntity } from '@/types/stadium';

export interface EvacuationZone {
  zoneId: string;
  zoneName: string;
  peopleRemaining: number;
  flowRatePerMinute: number;
  congestionScore: number;
  estimatedClearTime: number; // minutes
}

export interface EvacuationState {
  isActive: boolean;
  startedAt: Date | null;
  estimatedCompletion: Date | null;
  zones: EvacuationZone[];
  totalRemaining: number;
  exitDistribution: Record<string, number>; // gate -> percentage
  panicIndex: number;
  aggressionIndex: number;
  densityStressScore: number;
}

/**
 * Real-Time Evacuation Simulation Engine (RESE)
 * + Crowd Psychology Risk Modeling (CPRM)
 * + AI Entry Flow Balancing
 */
export function useEvacuationEngine(
  entities: VenueEntity[],
  currentAttendance: number,
  capacity: number,
  isEmergencyMode: boolean,
  eventId?: string,
) {
  const [state, setState] = useState<EvacuationState>({
    isActive: false,
    startedAt: null,
    estimatedCompletion: null,
    zones: [],
    totalRemaining: 0,
    exitDistribution: {},
    panicIndex: 0,
    aggressionIndex: 0,
    densityStressScore: 0,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Calculate crowd psychology metrics
  const calculatePsychologyMetrics = useCallback(() => {
    const densityRatio = capacity > 0 ? currentAttendance / capacity : 0;
    const highDensityZones = entities.filter(e => e.crowdDensity === 'high').length;
    const avgWait = entities.reduce((sum, e) => sum + e.estimatedWaitTime, 0) / Math.max(entities.length, 1);

    // Panic index: exponential when density > 80% and wait > 15min
    let panicIndex = 0;
    if (densityRatio > 0.8 && avgWait > 15) {
      panicIndex = Math.min(100, Math.round((densityRatio * 100 - 70) * 2 + avgWait * 1.5));
    } else if (densityRatio > 0.7) {
      panicIndex = Math.min(40, Math.round((densityRatio * 100 - 60) * 0.8));
    }

    // Aggression index: based on high-density clusters
    const aggressionIndex = Math.min(100, Math.round(highDensityZones * 15 + (avgWait > 10 ? avgWait * 2 : 0)));

    // Density stress
    const densityStressScore = Math.min(100, Math.round(densityRatio * 80 + highDensityZones * 5));

    return { panicIndex, aggressionIndex, densityStressScore };
  }, [entities, currentAttendance, capacity]);

  // Update psychology metrics every tick
  useEffect(() => {
    const metrics = calculatePsychologyMetrics();
    setState(prev => ({ ...prev, ...metrics }));
  }, [calculatePsychologyMetrics]);

  // Start evacuation simulation
  const startEvacuation = useCallback(() => {
    const gates = entities.filter(e => e.type === 'gate' || e.type === 'emergency_exit');
    const zones = gates.map(gate => ({
      zoneId: gate.id,
      zoneName: gate.name,
      peopleRemaining: Math.round(currentAttendance / Math.max(gates.length, 1)),
      flowRatePerMinute: gate.type === 'emergency_exit' ? 200 : 150,
      congestionScore: gate.crowdDensity === 'high' ? 0.8 : gate.crowdDensity === 'medium' ? 0.5 : 0.2,
      estimatedClearTime: 0,
    }));

    // Calculate estimated clear times
    zones.forEach(zone => {
      const effectiveFlow = zone.flowRatePerMinute * (1 - zone.congestionScore * 0.5);
      zone.estimatedClearTime = Math.ceil(zone.peopleRemaining / Math.max(effectiveFlow, 1));
    });

    // AI: Optimize exit distribution to prevent >85% density in any corridor
    const totalCapacity = zones.reduce((sum, z) => sum + z.flowRatePerMinute, 0);
    const distribution: Record<string, number> = {};
    zones.forEach(zone => {
      const baseShare = zone.flowRatePerMinute / totalCapacity;
      // Reduce share for congested exits, increase for clear ones
      const congestionPenalty = zone.congestionScore * 0.3;
      distribution[zone.zoneName] = Math.round((baseShare - congestionPenalty + 0.3 / zones.length) * 100);
    });

    // Normalize to 100%
    const totalPct = Object.values(distribution).reduce((a, b) => a + b, 0);
    Object.keys(distribution).forEach(k => {
      distribution[k] = Math.round((distribution[k] / totalPct) * 100);
    });

    const maxClearTime = Math.max(...zones.map(z => z.estimatedClearTime));
    const estimatedCompletion = new Date(Date.now() + maxClearTime * 60 * 1000);

    setState(prev => ({
      ...prev,
      isActive: true,
      startedAt: new Date(),
      estimatedCompletion,
      zones,
      totalRemaining: currentAttendance,
      exitDistribution: distribution,
    }));

    // Update event in DB
    if (eventId) {
      supabase.from('events').update({
        evacuation_mode: true,
        evacuation_started_at: new Date().toISOString(),
        evacuation_estimated_completion: estimatedCompletion.toISOString(),
      } as any).eq('id', eventId);
    }
  }, [entities, currentAttendance, eventId]);

  // Simulate evacuation progress
  useEffect(() => {
    if (!state.isActive) return;

    intervalRef.current = setInterval(() => {
      setState(prev => {
        const updatedZones = prev.zones.map(zone => {
          const effectiveFlow = zone.flowRatePerMinute * (1 - zone.congestionScore * 0.3);
          const evacuated = Math.round(effectiveFlow / 6); // per 10s tick
          const remaining = Math.max(0, zone.peopleRemaining - evacuated);
          const newCongestion = remaining > 0 ? Math.max(0.1, zone.congestionScore - 0.02) : 0;
          return {
            ...zone,
            peopleRemaining: remaining,
            congestionScore: newCongestion,
            estimatedClearTime: Math.ceil(remaining / Math.max(effectiveFlow, 1)),
          };
        });

        const totalRemaining = updatedZones.reduce((sum, z) => sum + z.peopleRemaining, 0);

        // Log to DB
        if (eventId && totalRemaining > 0) {
          updatedZones.forEach(zone => {
            supabase.from('evacuation_logs').insert({
              event_id: eventId,
              zone_id: zone.zoneId,
              people_remaining: zone.peopleRemaining,
              flow_rate_per_minute: zone.flowRatePerMinute,
              congestion_score: zone.congestionScore,
            } as any);
          });
        }

        if (totalRemaining <= 0) {
          clearInterval(intervalRef.current!);
          return { ...prev, zones: updatedZones, totalRemaining: 0, isActive: false };
        }

        return { ...prev, zones: updatedZones, totalRemaining };
      });
    }, 10000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.isActive, eventId]);

  const stopEvacuation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState(prev => ({ ...prev, isActive: false }));
    if (eventId) {
      supabase.from('events').update({ evacuation_mode: false } as any).eq('id', eventId);
    }
  }, [eventId]);

  // Entry Flow Balancing Algorithm
  const getOptimalGateRecommendation = useCallback(() => {
    const gates = entities.filter(e => e.type === 'gate' && e.isAvailable);
    if (gates.length === 0) return null;

    const scored = gates.map(gate => {
      const capacityRemaining = (gate.capacity || 100) - (gate.currentOccupancy || 0);
      const capRatio = capacityRemaining / (gate.capacity || 100);
      const waitPenalty = gate.estimatedWaitTime / 20;
      const distancePenalty = gate.distanceFromUser / 500;

      const score = capRatio * 0.4 - waitPenalty * 0.4 - distancePenalty * 0.2;
      return { gate, score, capacityRemaining };
    });

    scored.sort((a, b) => b.score - a.score);

    return {
      recommended: scored[0],
      all: scored,
      loadBalance: scored.map(s => ({
        name: s.gate.name,
        loadPct: Math.round(((s.gate.currentOccupancy || 0) / (s.gate.capacity || 100)) * 100),
      })),
      entryEfficiency: Math.round(
        (1 - (Math.max(...scored.map(s => s.gate.estimatedWaitTime)) - Math.min(...scored.map(s => s.gate.estimatedWaitTime))) / 20) * 100
      ),
    };
  }, [entities]);

  return {
    evacuationState: state,
    startEvacuation,
    stopEvacuation,
    getOptimalGateRecommendation,
    psychologyMetrics: {
      panicIndex: state.panicIndex,
      aggressionIndex: state.aggressionIndex,
      densityStressScore: state.densityStressScore,
    },
  };
}
