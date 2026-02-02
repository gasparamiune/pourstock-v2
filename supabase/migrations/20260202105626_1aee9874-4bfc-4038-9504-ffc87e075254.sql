-- Fix 1: Add fallback INSERT policy for profiles (users can create their own profile on signup)
-- This provides resilience if the handle_new_user trigger fails
CREATE POLICY "Users can create their own profile on signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Restrict stock_levels UPDATE to managers and admins only
-- Drop the existing overly permissive update policy
DROP POLICY IF EXISTS "Authenticated users can update stock levels" ON public.stock_levels;

-- Create new restricted UPDATE policy for stock_levels
CREATE POLICY "Managers and admins can update stock levels" 
ON public.stock_levels 
FOR UPDATE 
USING (is_manager_or_admin())
WITH CHECK (is_manager_or_admin());