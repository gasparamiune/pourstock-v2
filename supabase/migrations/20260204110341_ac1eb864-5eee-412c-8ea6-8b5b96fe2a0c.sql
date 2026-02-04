-- Remove the overly permissive SELECT policy for purchase_orders
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.purchase_orders;

-- Create a new restrictive SELECT policy for managers and admins only
CREATE POLICY "Managers and admins can view orders"
ON public.purchase_orders
FOR SELECT
USING (is_manager_or_admin());

-- Also update purchase_order_items to be consistent
DROP POLICY IF EXISTS "Authenticated users can view order items" ON public.purchase_order_items;

-- Create a new restrictive SELECT policy for managers and admins only on order items
CREATE POLICY "Managers and admins can view order items"
ON public.purchase_order_items
FOR SELECT
USING (is_manager_or_admin());