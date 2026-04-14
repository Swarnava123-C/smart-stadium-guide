CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events (event_date);
CREATE INDEX IF NOT EXISTS idx_events_stadium_id ON public.events (stadium_id);
CREATE INDEX IF NOT EXISTS idx_events_lifecycle_state ON public.events (lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_event_created ON public.attendance_logs (event_id, created_at);
CREATE INDEX IF NOT EXISTS idx_iot_stream_stadium ON public.iot_stream (stadium_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evacuation_logs_event ON public.evacuation_logs (event_id, created_at);
CREATE INDEX IF NOT EXISTS idx_compliance_event ON public.compliance_audit_log (event_id, created_at);
CREATE INDEX IF NOT EXISTS idx_event_snapshots_event ON public.event_snapshots (event_id);