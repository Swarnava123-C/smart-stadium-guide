import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { resolveAllEvents } from '@/utils/eventStatusResolver';

export interface Stadium {
  id: string;
  name: string;
  city: string;
  state: string;
  capacity: number;
  latitude: number;
  longitude: number;
  crowd_status: 'low' | 'medium' | 'high';
  image_url: string | null;
}

export interface StadiumEvent {
  id: string;
  stadium_id: string;
  event_name: string;
  event_date: string;
  end_time: string;
  expected_attendance: number;
  current_attendance: number;
  status: 'upcoming' | 'live' | 'completed';
  risk_score: number | null;
  delay_status: 'none' | 'weather' | 'technical' | 'security';
  delay_started_at: string | null;
  delay_total_minutes: number;
  is_paused: boolean;
  overtime_active: boolean;
  overtime_reason: string | null;
  overtime_minutes_added: number;
  is_multi_day: boolean;
  event_end_date: string | null;
  current_day_number: number;
  evacuation_mode: boolean;
  evacuation_started_at: string | null;
  evacuation_estimated_completion: string | null;
  is_locked: boolean;
  lifecycle_state: 'scheduled' | 'active' | 'finalizing' | 'archived';
}

export interface AttendanceLog {
  id: string;
  event_id: string;
  current_attendance: number;
  entry_rate: number;
  avg_wait_time: number;
  gate_statuses: Record<string, string>;
  surge_risk_score: number;
  created_at: string;
}

export interface EventSnapshot {
  id: string;
  event_id: string;
  final_attendance: number;
  peak_attendance: number;
  avg_wait_time: number;
  peak_surge_risk: number;
  incident_count: number;
  revenue_estimate: number;
  archived_at: string;
}


export function useStadiums() {
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const doFetch = async () => {
      try {
        const { data } = await supabase.from('stadiums').select('*');
        if (data) setStadiums(data as unknown as Stadium[]);
      } catch (err) {
        console.warn('[useStadiums] Fetch failed:', err);
      }
      setLoading(false);
    };
    doFetch();
  }, []);

  return { stadiums, loading };
}

export function useStadiumDetail(stadiumId: string | undefined) {
  const [stadium, setStadium] = useState<Stadium | null>(null);
  const [rawEvents, setRawEvents] = useState<StadiumEvent[]>([]);
  const [events, setEvents] = useState<StadiumEvent[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [snapshots, setSnapshots] = useState<EventSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchData = useCallback(async () => {
    if (!stadiumId) return;
    setSyncing(true);

    try {
      const [stadiumRes, eventsRes] = await Promise.all([
        supabase.from('stadiums').select('*').eq('id', stadiumId).single(),
        supabase.from('events').select('*').eq('stadium_id', stadiumId).order('event_date', { ascending: false }),
      ]);

      if (stadiumRes.data) setStadium(stadiumRes.data as unknown as Stadium);
      if (eventsRes.data) {
        const evts = eventsRes.data as unknown as StadiumEvent[];
        setRawEvents(evts);
        const resolved = resolveAllEvents(evts) as StadiumEvent[];
        setEvents(resolved);

        // Fetch attendance logs for active event (live or most recent completed with data)
        const liveEvent = resolved.find(e => e.status === 'live');
        const targetEvent = liveEvent || resolved.find(e => e.status === 'completed');

        if (targetEvent) {
          const { data: logData } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('event_id', targetEvent.id)
            .order('created_at', { ascending: true })
            .limit(200);
          if (logData) setLogs(logData as unknown as AttendanceLog[]);
        }

        // Fetch snapshots for all completed events
        const completedIds = resolved.filter(e => e.status === 'completed').map(e => e.id);
        if (completedIds.length > 0) {
          const { data: snapData } = await supabase
            .from('event_snapshots')
            .select('*')
            .in('event_id', completedIds);
          if (snapData) setSnapshots(snapData as unknown as EventSnapshot[]);
        }
      }
    } catch (err) {
      console.warn('[useStadiumDetail] Fetch error, will retry:', err);
    }

    setLoading(false);
    setSyncing(false);
  }, [stadiumId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-resolve status every 60 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (rawEvents.length > 0) {
        const resolved = resolveAllEvents(rawEvents) as StadiumEvent[];
        setEvents(resolved);
      }
      // Refetch data every 60s for live updates
      fetchData();
    }, 60000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [rawEvents, fetchData]);

  // Realtime subscriptions with auto-reconnect
  useEffect(() => {
    if (!stadiumId) return;

    const eventsChannel = supabase
      .channel(`events-${stadiumId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        const updated = payload.new as unknown as StadiumEvent;
        if (updated.stadium_id === stadiumId) {
          setRawEvents(prev => {
            const newList = prev.map(e => e.id === updated.id ? updated : e);
            if (!prev.find(e => e.id === updated.id)) newList.unshift(updated);
            const resolved = resolveAllEvents(newList) as StadiumEvent[];
            setEvents(resolved);
            return newList;
          });
        }
      })
      .subscribe();

    const logsChannel = supabase
      .channel(`logs-${stadiumId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, (payload) => {
        const newLog = payload.new as unknown as AttendanceLog;
        setLogs(prev => [...prev.slice(-199), newLog]); // Keep last 200
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [stadiumId]);

  return { stadium, events, logs, snapshots, loading, syncing, refetch: fetchData };
}
