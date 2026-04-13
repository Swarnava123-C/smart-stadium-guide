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
  // Delay fields
  delay_status: 'none' | 'weather' | 'technical' | 'security';
  delay_started_at: string | null;
  delay_total_minutes: number;
  is_paused: boolean;
  // Overtime fields
  overtime_active: boolean;
  overtime_reason: string | null;
  overtime_minutes_added: number;
  // Multi-day fields
  is_multi_day: boolean;
  event_end_date: string | null;
  current_day_number: number;
  // Evacuation fields
  evacuation_mode: boolean;
  evacuation_started_at: string | null;
  evacuation_estimated_completion: string | null;
  // Lifecycle fields
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

export function useStadiums() {
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('stadiums').select('*');
      if (data) setStadiums(data as unknown as Stadium[]);
      setLoading(false);
    };
    fetch();
  }, []);

  return { stadiums, loading };
}

export function useStadiumDetail(stadiumId: string | undefined) {
  const [stadium, setStadium] = useState<Stadium | null>(null);
  const [rawEvents, setRawEvents] = useState<StadiumEvent[]>([]);
  const [events, setEvents] = useState<StadiumEvent[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchData = useCallback(async () => {
    if (!stadiumId) return;
    
    const [stadiumRes, eventsRes] = await Promise.all([
      supabase.from('stadiums').select('*').eq('id', stadiumId).single(),
      supabase.from('events').select('*').eq('stadium_id', stadiumId).order('event_date', { ascending: false }),
    ]);

    if (stadiumRes.data) setStadium(stadiumRes.data as unknown as Stadium);
    if (eventsRes.data) {
      const evts = eventsRes.data as unknown as StadiumEvent[];
      setRawEvents(evts);
      // Resolve status dynamically
      const resolved = resolveAllEvents(evts) as StadiumEvent[];
      setEvents(resolved);
      
      // Fetch attendance logs for live events
      const liveEvent = resolved.find(e => e.status === 'live');
      if (liveEvent) {
        const { data: logData } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('event_id', liveEvent.id)
          .order('created_at', { ascending: true })
          .limit(100);
        if (logData) setLogs(logData as unknown as AttendanceLog[]);
      }
    }
    setLoading(false);
  }, [stadiumId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-resolve status every 60 seconds (handles upcoming→live→completed transitions)
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (rawEvents.length > 0) {
        const resolved = resolveAllEvents(rawEvents) as StadiumEvent[];
        setEvents(resolved);
      }
    }, 60000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [rawEvents]);

  // Subscribe to realtime updates
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
        setLogs(prev => [...prev, newLog]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(logsChannel);
    };
  }, [stadiumId]);

  return { stadium, events, logs, loading, refetch: fetchData };
}
