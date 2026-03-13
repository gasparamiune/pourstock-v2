
-- Add columns to housekeeping_tasks for expanded functionality
ALTER TABLE public.housekeeping_tasks 
  ADD COLUMN IF NOT EXISTS area_id uuid,
  ADD COLUMN IF NOT EXISTS checklist_progress jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS paused_reason text,
  ADD COLUMN IF NOT EXISTS estimated_minutes integer;

-- Create public_areas table
CREATE TABLE IF NOT EXISTS public.public_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  area_type text NOT NULL DEFAULT 'lobby',
  floor integer,
  zone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create hk_zones table
CREATE TABLE IF NOT EXISTS public.hk_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  floors integer[] DEFAULT '{}',
  assigned_staff uuid[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create hk_checklists table
CREATE TABLE IF NOT EXISTS public.hk_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  room_type text,
  task_type text,
  items jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create hk_incidents table (damage reporting)
CREATE TABLE IF NOT EXISTS public.hk_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id),
  reported_by uuid NOT NULL,
  category text NOT NULL DEFAULT 'other',
  severity text NOT NULL DEFAULT 'cosmetic',
  description text NOT NULL,
  is_blocking boolean NOT NULL DEFAULT false,
  photos jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'open',
  resolved_at timestamptz,
  financial_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create lost_found_items table
CREATE TABLE IF NOT EXISTS public.lost_found_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id),
  found_by uuid NOT NULL,
  found_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  storage_location text,
  photos jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'stored',
  claimed_by_guest text,
  returned_at timestamptz,
  discarded_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create deep_clean_schedules table
CREATE TABLE IF NOT EXISTS public.deep_clean_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id),
  interval_days integer NOT NULL DEFAULT 90,
  last_completed_at timestamptz,
  next_due date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add FK for area_id on housekeeping_tasks
ALTER TABLE public.housekeeping_tasks 
  ADD CONSTRAINT housekeeping_tasks_area_id_fkey 
  FOREIGN KEY (area_id) REFERENCES public.public_areas(id);

-- Enable RLS on all new tables
ALTER TABLE public.public_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hk_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hk_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hk_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deep_clean_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for public_areas
CREATE POLICY "Members can view public areas" ON public.public_areas FOR SELECT TO authenticated USING (is_hotel_member(auth.uid(), hotel_id));
CREATE POLICY "HK dept can manage public areas" ON public.public_areas FOR ALL TO authenticated USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role) OR is_hotel_dept_manager(auth.uid(), hotel_id, 'housekeeping'::department)) WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role) OR is_hotel_dept_manager(auth.uid(), hotel_id, 'housekeeping'::department));

-- RLS policies for hk_zones
CREATE POLICY "Members can view hk zones" ON public.hk_zones FOR SELECT TO authenticated USING (is_hotel_member(auth.uid(), hotel_id));
CREATE POLICY "Admins can manage hk zones" ON public.hk_zones FOR ALL TO authenticated USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)) WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role));

-- RLS policies for hk_checklists
CREATE POLICY "Members can view hk checklists" ON public.hk_checklists FOR SELECT TO authenticated USING (is_hotel_member(auth.uid(), hotel_id));
CREATE POLICY "Admins can manage hk checklists" ON public.hk_checklists FOR ALL TO authenticated USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)) WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role));

-- RLS policies for hk_incidents
CREATE POLICY "HK can view incidents" ON public.hk_incidents FOR SELECT TO authenticated USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role) OR has_hotel_department(auth.uid(), hotel_id, 'housekeeping'::department));
CREATE POLICY "HK can report incidents" ON public.hk_incidents FOR INSERT TO authenticated WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role) OR has_hotel_department(auth.uid(), hotel_id, 'housekeeping'::department));
CREATE POLICY "HK managers can update incidents" ON public.hk_incidents FOR UPDATE TO authenticated USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role) OR is_hotel_dept_manager(auth.uid(), hotel_id, 'housekeeping'::department));

-- RLS policies for lost_found_items
CREATE POLICY "HK and reception can view lost found" ON public.lost_found_items FOR SELECT TO authenticated USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role) OR has_hotel_department(auth.uid(), hotel_id, 'housekeeping'::department) OR has_hotel_department(auth.uid(), hotel_id, 'reception'::department));
CREATE POLICY "HK can insert lost found" ON public.lost_found_items FOR INSERT TO authenticated WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role) OR has_hotel_department(auth.uid(), hotel_id, 'housekeeping'::department));
CREATE POLICY "HK managers can update lost found" ON public.lost_found_items FOR UPDATE TO authenticated USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role) OR is_hotel_dept_manager(auth.uid(), hotel_id, 'housekeeping'::department));

-- RLS policies for deep_clean_schedules
CREATE POLICY "HK can view deep clean schedules" ON public.deep_clean_schedules FOR SELECT TO authenticated USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role) OR has_hotel_department(auth.uid(), hotel_id, 'housekeeping'::department));
CREATE POLICY "Admins can manage deep clean schedules" ON public.deep_clean_schedules FOR ALL TO authenticated USING (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role)) WITH CHECK (has_hotel_role(auth.uid(), hotel_id, 'hotel_admin'::hotel_role));

-- Enable realtime for housekeeping_tasks (if not already)
ALTER PUBLICATION supabase_realtime ADD TABLE public.housekeeping_tasks;
