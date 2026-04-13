
-- Add end_time column to events
ALTER TABLE public.events 
ADD COLUMN end_time timestamp with time zone;

-- Set end_time for existing events (4 hours after event_date by default)
UPDATE public.events 
SET end_time = event_date + interval '4 hours';

-- Make end_time NOT NULL after backfill
ALTER TABLE public.events 
ALTER COLUMN end_time SET NOT NULL;
