
-- Fix security definer views to use security invoker (RLS of querying user)
ALTER VIEW public.v_daily_occupancy SET (security_invoker = true);
ALTER VIEW public.v_revenue_summary SET (security_invoker = true);
ALTER VIEW public.v_stay_parity SET (security_invoker = true);
ALTER VIEW public.v_folio_parity SET (security_invoker = true);
