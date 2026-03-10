
-- Release announcements table
CREATE TABLE public.release_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  title text NOT NULL,
  summary text,
  content text NOT NULL,
  audience_type text NOT NULL DEFAULT 'all',
  audience_roles text[] NULL,
  audience_hotels uuid[] NULL,
  audience_modules text[] NULL,
  severity text NOT NULL DEFAULT 'info',
  is_mandatory boolean NOT NULL DEFAULT false,
  is_silent boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  source text NULL,
  raw_release_notes text NULL,
  user_facing_notes text NULL
);

-- Per-user read state
CREATE TABLE public.user_release_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES public.release_announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  dismissed_at timestamptz NULL,
  acknowledged_at timestamptz NULL,
  UNIQUE(release_id, user_id)
);

-- Indexes
CREATE INDEX idx_release_announcements_published ON public.release_announcements (is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX idx_user_release_reads_user ON public.user_release_reads (user_id);
CREATE INDEX idx_user_release_reads_release ON public.user_release_reads (release_id);

-- Enable RLS
ALTER TABLE public.release_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_release_reads ENABLE ROW LEVEL SECURITY;

-- RLS: Any authenticated user can read published announcements
CREATE POLICY "Authenticated users can view published releases"
  ON public.release_announcements FOR SELECT TO authenticated
  USING (is_published = true);

-- RLS: Admins can view all (including drafts)
CREATE POLICY "Admins can view all releases"
  ON public.release_announcements FOR SELECT TO authenticated
  USING (public.is_admin());

-- RLS: Admins can insert releases
CREATE POLICY "Admins can insert releases"
  ON public.release_announcements FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- RLS: Admins can update releases
CREATE POLICY "Admins can update releases"
  ON public.release_announcements FOR UPDATE TO authenticated
  USING (public.is_admin());

-- RLS: Admins can delete releases
CREATE POLICY "Admins can delete releases"
  ON public.release_announcements FOR DELETE TO authenticated
  USING (public.is_admin());

-- RLS: Users can view their own read state
CREATE POLICY "Users can view own read state"
  ON public.user_release_reads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS: Users can insert their own read state
CREATE POLICY "Users can insert own read state"
  ON public.user_release_reads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS: Users can update their own read state
CREATE POLICY "Users can update own read state"
  ON public.user_release_reads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_release_announcements_updated_at
  BEFORE UPDATE ON public.release_announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
