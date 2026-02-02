-- Fix 1: Add authentication requirement for profiles SELECT
-- Drop existing permissive/restrictive SELECT policies and recreate with proper authentication
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create proper authenticated SELECT policies for profiles
CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_admin());

-- Fix 2: Add INSERT and DELETE policies for profiles table
-- INSERT: Only the trigger (SECURITY DEFINER) should create profiles, but admins can also manually create
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (is_admin());

-- DELETE: Only admins can delete profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (is_admin());

-- Fix 3: Add authentication requirement for stock_movements SELECT
-- Drop existing SELECT policy and recreate with authentication requirement
DROP POLICY IF EXISTS "Authenticated users can view movements" ON public.stock_movements;

-- Create authenticated SELECT policy for stock_movements
CREATE POLICY "Authenticated users can view movements" 
ON public.stock_movements 
FOR SELECT 
USING (auth.uid() IS NOT NULL);