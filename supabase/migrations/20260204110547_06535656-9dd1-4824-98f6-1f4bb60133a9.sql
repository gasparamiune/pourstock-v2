-- Remove the current SELECT policy that allows all authenticated users
DROP POLICY IF EXISTS "Authenticated users can view movements" ON public.stock_movements;

-- Create a new SELECT policy restricted to managers and admins only
CREATE POLICY "Managers and admins can view movements"
ON public.stock_movements
FOR SELECT
USING (is_manager_or_admin());