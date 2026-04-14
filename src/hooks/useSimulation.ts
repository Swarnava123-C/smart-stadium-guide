import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StadiumEvent } from './useStadiums';
import { resolveEventStatus } from '@/utils/eventStatusResolver';

/**
 * Client-side simulation engine — Production hardened
 * 
 * GUARD: Only runs for events that are:
 * - Dynamically resolved as 'live'
 * - NOT locked (is_locked === false)
 * - NOT paused (is_paused === false)
 * 
 * Writes both event attendance AND attendance_logs for data persistence.
 */
export function useSimulation(events: StadiumEvent[], isEmergencyMode: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const lastTickRef = useRef<number>(0);

  const tick = useCallback(async () => {
    // Throttle: max once per 8 seconds
    const now = Date.now();
    if (now - lastTickRef.current < 8000) return;
    lastTickRef.current = now;

    for (const event of events) {
      if (event.is_locked || event.is_paused) continue;

      const currentStatus = resolveEventStatus(event.event_date, event.end_time, undefined, {
        isPaused: event.is_paused,
        overtimeActive: event.overtime_active,
        overtimeMinutesAdded: event.overtime_minutes_added,
        delayTotalMinutes: event.delay_total_minutes,
        isLocked: event.is_locked,
      });

      if (currentStatus !== 'live') continue;

      const growth = Math.floor(Math.random() * 150) + 50;
      const newAttendance = Math.min(
        event.expected_attendance,
        event.current_attendance + growth
      );

      const capacityRatio = newAttendance / event.expected_attendance;
      const avgWaitTime = Math.round((2 + capacityRatio * 12) * 10) / 10;
      const entryRate = Math.round(growth * 6); // per minute approximation
      const surgeRiskScore = Math.min(1, capacityRatio * 0.7 + (avgWaitTime > 8 ? 0.2 : 0) + Math.random() * 0.1);

      // Gate status logic
      const numGates = 4;
      const gateStatuses: Record<string, string> = {};
      for (let i = 1; i <= numGates; i++) {
        gateStatuses[`gate_${i}`] = capacityRatio > 0.8 || i <= Math.ceil(numGates * capacityRatio) ? 'open' : 'closed';
      }

      try {
        // Update event attendance
        await supabase.from('events').update({ current_attendance: newAttendance } as any).eq('id', event.id);

        // Write attendance log for historical tracking
        await supabase.from('attendance_logs').insert({
          event_id: event.id,
          current_attendance: newAttendance,
          entry_rate: entryRate,
          avg_wait_time: avgWaitTime,
          gate_statuses: gateStatuses,
          surge_risk_score: Math.round(surgeRiskScore * 100) / 100,
        } as any);

        // Update stadium crowd status
        const crowdStatus = capacityRatio < 0.4 ? 'low' : capacityRatio < 0.7 ? 'medium' : 'high';
        await supabase.from('stadiums').update({ crowd_status: crowdStatus as any }).eq('id', event.stadium_id);
      } catch (err) {
        console.warn('[Simulation] Write failed, will retry next tick:', err);
      }
    }
  }, [events]);

  useEffect(() => {
    if (isEmergencyMode) return;

    intervalRef.current = setInterval(tick, 10000);
    // Immediate first tick
    tick();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tick, isEmergencyMode]);
}
