import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { resolveAllEvents } from '@/utils/eventStatusResolver';
import { Stadium, StadiumEvent } from './useStadiums';

export interface NationalOverview {
  totalLiveEvents: number;
  totalAttendanceNationwide: number;
  highRiskStadiums: string[];
  activeEmergencies: number;
  avgWaitTimeNational: number;
  stadiumStatuses: StadiumStatus[];
}

export interface StadiumStatus {
  stadium: Stadium;
  liveEvent: StadiumEvent | null;
  surgeRisk: number;
  occupancyPct: number;
  isEmergency: boolean;
}

export function useNationalOverview() {
  const [overview, setOverview] = useState<NationalOverview>({
    totalLiveEvents: 0,
    totalAttendanceNationwide: 0,
    highRiskStadiums: [],
    activeEmergencies: 0,
    avgWaitTimeNational: 0,
    stadiumStatuses: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    const [stadiumsRes, eventsRes, logsRes] = await Promise.all([
      supabase.from('stadiums').select('*'),
      supabase.from('events').select('*'),
      supabase.from('attendance_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    const stadiums = (stadiumsRes.data || []) as unknown as Stadium[];
    const rawEvents = (eventsRes.data || []) as unknown as StadiumEvent[];
    const events = resolveAllEvents(rawEvents) as StadiumEvent[];
    const logs = logsRes.data || [];

    const liveEvents = events.filter(e => e.status === 'live');
    const totalAttendance = liveEvents.reduce((sum, e) => sum + e.current_attendance, 0);

    // Build per-stadium status
    const statuses: StadiumStatus[] = stadiums.map(stadium => {
      const stadiumEvents = events.filter(e => e.stadium_id === stadium.id);
      const live = stadiumEvents.find(e => e.status === 'live') || null;
      const stadiumLogs = logs.filter((l: any) => live && l.event_id === live.id);
      const latestLog = stadiumLogs.length > 0 ? stadiumLogs[0] : null;

      return {
        stadium,
        liveEvent: live,
        surgeRisk: (latestLog as any)?.surge_risk_score || 0,
        occupancyPct: live ? Math.round((live.current_attendance / stadium.capacity) * 100) : 0,
        isEmergency: (live as any)?.evacuation_mode || false,
      };
    });

    const highRisk = statuses
      .filter(s => s.surgeRisk > 0.85 || s.occupancyPct > 95)
      .map(s => s.stadium.name);

    const avgWait = logs.length > 0
      ? logs.reduce((sum: number, l: any) => sum + (l.avg_wait_time || 0), 0) / logs.length
      : 0;

    setOverview({
      totalLiveEvents: liveEvents.length,
      totalAttendanceNationwide: totalAttendance,
      highRiskStadiums: highRisk,
      activeEmergencies: statuses.filter(s => s.isEmergency).length,
      avgWaitTimeNational: Math.round(avgWait * 10) / 10,
      stadiumStatuses: statuses,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  return { overview, loading, refetch: fetchOverview };
}
