
-- Add unique constraint on version to prevent duplicate releases
ALTER TABLE public.release_announcements ADD CONSTRAINT release_announcements_version_unique UNIQUE (version);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_release_announcements_published_at ON public.release_announcements (published_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_release_announcements_is_published ON public.release_announcements (is_published);
CREATE INDEX IF NOT EXISTS idx_user_release_reads_user_release ON public.user_release_reads (user_id, release_id);
