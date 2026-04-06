
-- Create crowd status enum
CREATE TYPE public.crowd_status AS ENUM ('low', 'medium', 'high');

-- Create event status enum  
CREATE TYPE public.event_status AS ENUM ('upcoming', 'live', 'completed');

-- Stadiums table
CREATE TABLE public.stadiums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  crowd_status crowd_status NOT NULL DEFAULT 'low',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stadium_id UUID NOT NULL REFERENCES public.stadiums(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expected_attendance INTEGER NOT NULL,
  current_attendance INTEGER NOT NULL DEFAULT 0,
  status event_status NOT NULL DEFAULT 'upcoming',
  risk_score DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Attendance logs table
CREATE TABLE public.attendance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  current_attendance INTEGER NOT NULL DEFAULT 0,
  entry_rate INTEGER NOT NULL DEFAULT 0,
  avg_wait_time DOUBLE PRECISION NOT NULL DEFAULT 0,
  gate_statuses JSONB NOT NULL DEFAULT '{}',
  surge_risk_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_events_stadium_id ON public.events(stadium_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_attendance_logs_event_id ON public.attendance_logs(event_id);
CREATE INDEX idx_attendance_logs_created_at ON public.attendance_logs(created_at);

-- Enable RLS
ALTER TABLE public.stadiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view stadiums" ON public.stadiums FOR SELECT USING (true);
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Anyone can view attendance logs" ON public.attendance_logs FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can manage stadiums" ON public.stadiums FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage events" ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage attendance logs" ON public.attendance_logs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow anonymous inserts to attendance_logs (for simulation engine)
CREATE POLICY "Service can insert attendance logs" ON public.attendance_logs FOR INSERT WITH CHECK (true);

-- Enable realtime for attendance_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_stadiums_updated_at BEFORE UPDATE ON public.stadiums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
