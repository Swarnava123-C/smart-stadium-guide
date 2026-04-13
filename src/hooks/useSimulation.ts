import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StadiumEvent } from './useStadiums';
import { resolveEventStatus } from '@/utils/eventStatusResolver';

/**
 * Client-side simulation engine that:
 * 1. Simulates attendance growth for live events (status computed dynamically)
 * 2. Logs attendance data periodically
 * 3. Updates stadium crowd status
 * 
 * GUARD: Only runs for events that are:
 * - Dynamically resolved as 'live'
 * - NOT locked (is_locked === false)
 * - NOT paused (is_paused === false)
 */
export function useSimulation(events: StadiumEvent[], isEmergencyMode: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (isEmergencyMode) return;

    const tick = async () => {
      for (const event of events) {
        // Simulation guard: skip locked or paused events
        if ((event as any).is_locked || (event as any).is_paused) continue;

        // Always use dynamic status resolution
        const currentStatus = resolveEventStatus(event.event_date, event.end_time, undefined, {
          isPaused: (event as any).is_paused,
          overtimeActive: (event as any).overtime_active,
          overtimeMinutesAdded: (event as any).overtime_minutes_added,
          delayTotalMinutes: (event as any).delay_total_minutes,
          isLocked: (event as any).is_locked,
        });

        // Only simulate live events
        if (currentStatus !== 'live') continue;

        const growth = Math.floor(Math.random() * 150) + 50;
        const newAttendance = Math.min(
          event.expected_attendance,
          event.current_attendance + growth
        );

        const capacityRatio = newAttendance / event.expected_attendance;
        const avgWaitTime = Math.round((2 + capacityRatio * 12) * 10) / 10;

        // Gate status logic
        const numGates = 4;
        const gateStatuses: Record<string, string> = {};
        for (let i = 1; i <= numGates; i++) {
          gateStatuses[`gate_${i}`] = capacityRatio > 0.8 || i <= Math.ceil(numGates * capacityRatio) ? 'open' : 'closed';
        }

        await supabase.from('events').update({ current_attendance: newAttendance } as any).eq('id', event.id);

        // Update stadium crowd status
        const crowdStatus = capacityRatio < 0.4 ? 'low' : capacityRatio < 0.7 ? 'medium' : 'high';
        await supabase.from('stadiums').update({ crowd_status: crowdStatus as any }).eq('id', event.stadium_id);
      }
    };

    intervalRef.current = setInterval(tick, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [events, isEmergencyMode]);
}
