import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StadiumEvent, Stadium, AttendanceLog } from './useStadiums';
import { resolveEventStatus } from '@/utils/eventStatusResolver';

export function useEventDetail(eventId: string | undefined) {
  const [event, setEvent] = useState<StadiumEvent | null>(null);
  const [stadium, setStadium] = useState<Stadium | null>(null);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const resolveEvent = (evt: StadiumEvent): StadiumEvent => ({
    ...evt,
    status: resolveEventStatus(evt.event_date, evt.end_time),
  });

  const fetchData = useCallback(async () => {
    if (!eventId) return;

    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!eventData) {
      setLoading(false);
      return;
    }

    const evt = resolveEvent(eventData as unknown as StadiumEvent);
    setEvent(evt);

    const [stadiumRes, logsRes] = await Promise.all([
      supabase.from('stadiums').select('*').eq('id', evt.stadium_id).single(),
      supabase.from('attendance_logs').select('*').eq('event_id', eventId).order('created_at', { ascending: true }).limit(100),
    ]);

    if (stadiumRes.data) setStadium(stadiumRes.data as unknown as Stadium);
    if (logsRes.data) setLogs(logsRes.data as unknown as AttendanceLog[]);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-resolve status every 60 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => {
      setEvent(prev => prev ? resolveEvent(prev) : null);
    }, 60000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Realtime for live events
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`event-detail-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `id=eq.${eventId}` }, (payload) => {
        setEvent(resolveEvent(payload.new as unknown as StadiumEvent));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_logs', filter: `event_id=eq.${eventId}` }, (payload) => {
        setLogs(prev => [...prev, payload.new as unknown as AttendanceLog]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  return { event, stadium, logs, loading };
}
