
-- Create table_plan_changes table for reception→restaurant change requests
CREATE TABLE public.table_plan_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_date date NOT NULL,
  table_id text NOT NULL,
  change_type text NOT NULL,
  change_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  previous_data jsonb,
  status text NOT NULL DEFAULT 'pending',
  requested_by uuid NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.table_plan_changes ENABLE ROW LEVEL SECURITY;

-- Restaurant + Admin can view all changes
CREATE POLICY "Restaurant and admin can view changes"
  ON public.table_plan_changes FOR SELECT
  USING (is_admin() OR has_department(auth.uid(), 'restaurant'::department) OR has_department(auth.uid(), 'reception'::department));

-- Reception can insert changes
CREATE POLICY "Reception can insert changes"
  ON public.table_plan_changes FOR INSERT
  WITH CHECK (is_admin() OR has_department(auth.uid(), 'reception'::department) OR has_department(auth.uid(), 'restaurant'::department));

-- Restaurant + Admin can update (accept/decline)
CREATE POLICY "Restaurant can update changes"
  ON public.table_plan_changes FOR UPDATE
  USING (is_admin() OR has_department(auth.uid(), 'restaurant'::department));

-- Admin can delete
CREATE POLICY "Admin can delete changes"
  ON public.table_plan_changes FOR DELETE
  USING (is_admin());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_plan_changes;
