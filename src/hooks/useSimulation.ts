import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StadiumEvent } from './useStadiums';

/**
 * Client-side simulation engine that:
 * 1. Auto-activates upcoming events when event_date <= now
 * 2. Simulates attendance growth for live events
 * 3. Marks events as completed when attendance >= expected
 * 4. Logs attendance data periodically
 */
export function useSimulation(events: StadiumEvent[], isEmergencyMode: boolean) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (isEmergencyMode) return; // Pause simulation in emergency mode

    const tick = async () => {
      for (const event of events) {
        const now = new Date();
        const eventDate = new Date(event.event_date);

        // Auto-activate upcoming events
        if (event.status === 'upcoming' && now >= eventDate) {
          await supabase
            .from('events')
            .update({ status: 'live' as any, current_attendance: Math.floor(event.expected_attendance * 0.1) } as any)
            .eq('id', event.id);
          continue;
        }

        // Simulate live events
        if (event.status === 'live') {
          const growth = Math.floor(Math.random() * 150) + 50; // 50-200 per tick
          const newAttendance = Math.min(
            event.expected_attendance,
            event.current_attendance + growth
          );

          // Calculate metrics
          const entryRate = growth * 6; // per minute (tick is every 10s)
          const capacityRatio = newAttendance / event.expected_attendance;
          const avgWaitTime = Math.round((2 + capacityRatio * 12) * 10) / 10;
          
          // Gate status logic
          const numGates = 4;
          const gateStatuses: Record<string, string> = {};
          for (let i = 1; i <= numGates; i++) {
            gateStatuses[`gate_${i}`] = capacityRatio > 0.8 || i <= Math.ceil(numGates * capacityRatio) ? 'open' : 'closed';
          }

          // Surge risk: projected 15-min growth vs remaining capacity
          const projectedIn15Min = newAttendance + (entryRate * 15);
          const surgeRisk = Math.min(1, Math.max(0, projectedIn15Min / event.expected_attendance));

          // Update event
          const updates: any = { current_attendance: newAttendance };
          if (newAttendance >= event.expected_attendance) {
            updates.status = 'completed';
          }
          
          await supabase.from('events').update(updates).eq('id', event.id);

          // Also update stadium crowd status
          const crowdStatus = capacityRatio < 0.4 ? 'low' : capacityRatio < 0.7 ? 'medium' : 'high';
          await supabase.from('stadiums').update({ crowd_status: crowdStatus as any }).eq('id', event.stadium_id);
        }
      }
    };

    intervalRef.current = setInterval(tick, 10000); // Every 10 seconds
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [events, isEmergencyMode]);
}
