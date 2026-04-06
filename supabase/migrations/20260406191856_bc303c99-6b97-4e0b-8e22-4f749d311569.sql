
-- Drop the overly permissive insert policy
DROP POLICY "Service can insert attendance logs" ON public.attendance_logs;
