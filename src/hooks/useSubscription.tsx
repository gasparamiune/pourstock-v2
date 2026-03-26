import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInCalendarDays } from 'date-fns';

export interface Subscription {
  id: string;
  hotel_id: string;
  plan: 'trial' | 'starter' | 'professional' | 'enterprise';
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  cancel_at_period_end: boolean;
  seats: number;
}

export function useSubscription() {
  const { activeHotelId: hotelId } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscription', hotelId],
    queryFn: async () => {
      if (!hotelId) return null;
      const { data, error } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('hotel_id', hotelId)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isTrialing = data?.status === 'trialing';
  const isActive = data?.status === 'active';
  const isCanceled = data?.status === 'canceled';
  const isPastDue = data?.status === 'past_due';

  const trialDaysRemaining = isTrialing && data?.trial_ends_at
    ? Math.max(0, differenceInCalendarDays(new Date(data.trial_ends_at), new Date()))
    : null;

  const trialExpired = isTrialing && trialDaysRemaining !== null && trialDaysRemaining <= 0;

  const planLabel: Record<string, string> = {
    trial: 'Free Trial',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  };

  return {
    subscription: data ?? null,
    isLoading,
    error,
    isTrialing,
    isActive,
    isCanceled,
    isPastDue,
    trialDaysRemaining,
    trialExpired,
    plan: data?.plan ?? 'trial',
    planLabel: planLabel[data?.plan ?? 'trial'] ?? 'Free Trial',
    seats: data?.seats ?? 5,
  };
}
