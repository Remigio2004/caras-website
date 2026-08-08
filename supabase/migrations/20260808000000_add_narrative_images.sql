-- Add support for multiple narrative images per event
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS narrative_images text[] NOT NULL DEFAULT '{}';

