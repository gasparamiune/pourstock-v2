
-- 2. Fix privilege escalation: Replace the overly permissive ALL policy on user_roles
DROP POLICY IF EXISTS "Managers and admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 3. Fix cross-hotel department leak: Add hotel_id to user_departments
ALTER TABLE public.user_departments ADD COLUMN IF NOT EXISTS hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE;

UPDATE public.user_departments ud
SET hotel_id = (
  SELECT hm.hotel_id FROM public.hotel_members hm
  WHERE hm.user_id = ud.user_id AND hm.is_approved = true
  LIMIT 1
)
WHERE ud.hotel_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_departments WHERE hotel_id IS NULL) THEN
    ALTER TABLE public.user_departments ALTER COLUMN hotel_id SET NOT NULL;
  END IF;
END $$;

-- 4. Replace department helper functions with hotel_id filter
CREATE OR REPLACE FUNCTION public.has_hotel_department(_user_id uuid, _hotel_id uuid, _department department)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_departments
    WHERE user_id = _user_id
      AND department = _department
      AND hotel_id = _hotel_id
  ) AND public.is_hotel_member(_user_id, _hotel_id)
$$;

CREATE OR REPLACE FUNCTION public.is_hotel_dept_manager(_user_id uuid, _hotel_id uuid, _department department)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_departments
    WHERE user_id = _user_id
      AND department = _department
      AND department_role = 'manager'
      AND hotel_id = _hotel_id
  ) AND public.is_hotel_member(_user_id, _hotel_id)
$$;
