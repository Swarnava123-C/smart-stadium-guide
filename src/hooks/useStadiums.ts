import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  expected_attendance: number;
  current_attendance: number;
  status: 'upcoming' | 'live' | 'completed';
  risk_score: number | null;
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
  const [events, setEvents] = useState<StadiumEvent[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!stadiumId) return;
    
    const [stadiumRes, eventsRes] = await Promise.all([
      supabase.from('stadiums').select('*').eq('id', stadiumId).single(),
      supabase.from('events').select('*').eq('stadium_id', stadiumId).order('event_date', { ascending: false }),
    ]);

    if (stadiumRes.data) setStadium(stadiumRes.data as unknown as Stadium);
    if (eventsRes.data) {
      const evts = eventsRes.data as unknown as StadiumEvent[];
      setEvents(evts);
      
      // Fetch attendance logs for live events
      const liveEvent = evts.find(e => e.status === 'live');
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

  // Subscribe to realtime updates for events and logs
  useEffect(() => {
    if (!stadiumId) return;

    const eventsChannel = supabase
      .channel(`events-${stadiumId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        const updated = payload.new as unknown as StadiumEvent;
        if (updated.stadium_id === stadiumId) {
          setEvents(prev => {
            const idx = prev.findIndex(e => e.id === updated.id);
            if (idx >= 0) return prev.map(e => e.id === updated.id ? updated : e);
            return [updated, ...prev];
          });
        }
      })
      .subscribe();

    const logsChannel = supabase
      .channel(`logs-${stadiumId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs' }, (payload) => {
        const newLog = payload.new as unknown as AttendanceLog;
        // Check if this log belongs to a live event of this stadium
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
