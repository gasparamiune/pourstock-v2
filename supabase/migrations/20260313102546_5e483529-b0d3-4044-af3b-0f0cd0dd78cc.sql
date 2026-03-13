
-- Create ai_cache table for caching parsed PDF results
CREATE TABLE public.ai_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  content_hash text NOT NULL,
  job_type text NOT NULL DEFAULT 'parse_table_plan',
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  hit_count integer NOT NULL DEFAULT 0,
  UNIQUE (hotel_id, content_hash, job_type)
);

ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view ai_cache" ON public.ai_cache
  FOR SELECT TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Members can insert ai_cache" ON public.ai_cache
  FOR INSERT TO authenticated
  WITH CHECK (is_hotel_member(auth.uid(), hotel_id));

CREATE POLICY "Members can update ai_cache" ON public.ai_cache
  FOR UPDATE TO authenticated
  USING (is_hotel_member(auth.uid(), hotel_id));

-- Add token tracking columns to ai_jobs
ALTER TABLE public.ai_jobs
  ADD COLUMN IF NOT EXISTS tokens_used integer,
  ADD COLUMN IF NOT EXISTS estimated_cost numeric;
