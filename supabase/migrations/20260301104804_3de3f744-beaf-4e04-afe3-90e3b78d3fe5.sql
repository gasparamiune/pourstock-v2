
-- Create table_plans table for auto-save and saved plans
CREATE TABLE public.table_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  plan_date date NOT NULL,
  name text NOT NULL DEFAULT '',
  assignments_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.table_plans ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Authenticated users can view table plans"
ON public.table_plans FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert their own plans
CREATE POLICY "Authenticated users can create table plans"
ON public.table_plans FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Authenticated users can update their own plans
CREATE POLICY "Authenticated users can update their own plans"
ON public.table_plans FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

-- Admins can delete any plan
CREATE POLICY "Admins can delete table plans"
ON public.table_plans FOR DELETE
TO authenticated
USING (public.is_admin());

-- Users can delete their own plans
CREATE POLICY "Users can delete their own plans"
ON public.table_plans FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Unique constraint on date per user
CREATE UNIQUE INDEX idx_table_plans_date_user ON public.table_plans (plan_date, created_by);

-- Updated_at trigger
CREATE TRIGGER update_table_plans_updated_at
BEFORE UPDATE ON public.table_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
