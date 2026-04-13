
-- New enums
CREATE TYPE public.delay_status AS ENUM ('none', 'weather', 'technical', 'security');
CREATE TYPE public.overtime_reason AS ENUM ('super_over', 'tie_break', 'ceremony_extension');
CREATE TYPE public.lifecycle_state AS ENUM ('scheduled', 'active', 'finalizing', 'archived');

-- Extend events table
ALTER TABLE public.events
  ADD COLUMN delay_status public.delay_status NOT NULL DEFAULT 'none',
  ADD COLUMN delay_started_at timestamp with time zone,
  ADD COLUMN delay_total_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN is_paused boolean NOT NULL DEFAULT false,
  ADD COLUMN overtime_active boolean NOT NULL DEFAULT false,
  ADD COLUMN overtime_reason public.overtime_reason,
  ADD COLUMN overtime_minutes_added integer NOT NULL DEFAULT 0,
  ADD COLUMN is_multi_day boolean NOT NULL DEFAULT false,
  ADD COLUMN event_end_date timestamp with time zone,
  ADD COLUMN current_day_number integer NOT NULL DEFAULT 1,
  ADD COLUMN evacuation_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN evacuation_started_at timestamp with time zone,
  ADD COLUMN evacuation_estimated_completion timestamp with time zone,
  ADD COLUMN is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN lifecycle_state public.lifecycle_state NOT NULL DEFAULT 'scheduled';

-- Event snapshots (created when event completes)
CREATE TABLE public.event_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  final_attendance integer NOT NULL DEFAULT 0,
  peak_attendance integer NOT NULL DEFAULT 0,
  avg_wait_time double precision NOT NULL DEFAULT 0,
  peak_surge_risk double precision NOT NULL DEFAULT 0,
  incident_count integer NOT NULL DEFAULT 0,
  revenue_estimate double precision NOT NULL DEFAULT 0,
  archived_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event snapshots"
  ON public.event_snapshots FOR SELECT USING (true);

CREATE POLICY "Admins can manage event snapshots"
  ON public.event_snapshots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Event daily snapshots (multi-day events)
CREATE TABLE public.event_daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  day_number integer NOT NULL,
  attendance integer NOT NULL DEFAULT 0,
  peak_surge double precision NOT NULL DEFAULT 0,
  avg_wait double precision NOT NULL DEFAULT 0,
  incidents integer NOT NULL DEFAULT 0,
  archived_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_daily_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily snapshots"
  ON public.event_daily_snapshots FOR SELECT USING (true);

CREATE POLICY "Admins can manage daily snapshots"
  ON public.event_daily_snapshots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Evacuation logs
CREATE TABLE public.evacuation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  zone_id text NOT NULL,
  people_remaining integer NOT NULL DEFAULT 0,
  flow_rate_per_minute integer NOT NULL DEFAULT 0,
  congestion_score double precision NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.evacuation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view evacuation logs"
  ON public.evacuation_logs FOR SELECT USING (true);

CREATE POLICY "Admins can manage evacuation logs"
  ON public.evacuation_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- IoT sensor stream
CREATE TABLE public.iot_stream (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id uuid NOT NULL,
  zone_id text NOT NULL,
  sensor_type text NOT NULL,
  value double precision NOT NULL DEFAULT 0,
  confidence_score double precision NOT NULL DEFAULT 1.0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.iot_stream ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view iot stream"
  ON public.iot_stream FOR SELECT USING (true);

CREATE POLICY "Admins can manage iot stream"
  ON public.iot_stream FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Compliance audit log
CREATE TABLE public.compliance_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  violation_type text NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  resolved boolean NOT NULL DEFAULT false,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view compliance logs"
  ON public.compliance_audit_log FOR SELECT USING (true);

CREATE POLICY "Admins can manage compliance logs"
  ON public.compliance_audit_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.evacuation_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_stream;
