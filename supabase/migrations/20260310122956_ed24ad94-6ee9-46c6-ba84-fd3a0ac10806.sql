
-- 1. Add new columns to release_announcements
ALTER TABLE public.release_announcements 
  ADD COLUMN IF NOT EXISTS commit_messages jsonb NULL,
  ADD COLUMN IF NOT EXISTS filtered_commit_messages jsonb NULL,
  ADD COLUMN IF NOT EXISTS release_fingerprint text NULL,
  ADD COLUMN IF NOT EXISTS ai_model text NULL,
  ADD COLUMN IF NOT EXISTS generation_status text NOT NULL DEFAULT 'generated';

-- 2. Convert content from text to jsonb
ALTER TABLE public.release_announcements 
  ALTER COLUMN content TYPE jsonb 
  USING CASE 
    WHEN content IS NULL OR content = '' THEN '[]'::jsonb
    ELSE to_jsonb(string_to_array(content, E'\n'))
  END;

ALTER TABLE public.release_announcements 
  ALTER COLUMN content SET DEFAULT '[]'::jsonb;

-- 3. Add unique constraint on release_fingerprint where not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_release_fingerprint_unique 
  ON public.release_announcements(release_fingerprint) 
  WHERE release_fingerprint IS NOT NULL;

-- 4. Add indexes (IF NOT EXISTS for safety)
CREATE INDEX IF NOT EXISTS idx_release_published_at_desc 
  ON public.release_announcements(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_release_created_at_desc 
  ON public.release_announcements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_release_is_published 
  ON public.release_announcements(is_published);

-- 5. Create release_metrics table
CREATE TABLE IF NOT EXISTS public.release_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.release_announcements(id) ON DELETE CASCADE,
  view_count integer NOT NULL DEFAULT 0,
  dismiss_count integer NOT NULL DEFAULT 0,
  acknowledge_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(release_id)
);

ALTER TABLE public.release_metrics ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read metrics
CREATE POLICY "Authenticated can view release metrics"
  ON public.release_metrics FOR SELECT TO authenticated
  USING (true);

-- RLS: only service role / edge functions can write metrics (no direct user writes)
-- No INSERT/UPDATE policies for authenticated users - metrics are updated server-side
