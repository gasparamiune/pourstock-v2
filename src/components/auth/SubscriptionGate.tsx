import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

type Plan = 'trial' | 'starter' | 'professional' | 'enterprise';

const PLAN_RANK: Record<Plan, number> = {
  trial: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

interface SubscriptionGateProps {
  requiredPlan: 'starter' | 'professional' | 'enterprise';
  children: ReactNode;
  feature?: string;
}

export function SubscriptionGate({ requiredPlan, children, feature }: SubscriptionGateProps) {
  const { plan, isTrialing, isLoading } = useSubscription();

  if (isLoading) return <>{children}</>;

  // Trial has access to everything
  if (isTrialing) return <>{children}</>;

  const currentRank = PLAN_RANK[plan as Plan] ?? 0;
  const requiredRank = PLAN_RANK[requiredPlan];

  if (currentRank >= requiredRank) return <>{children}</>;

  const planLabel = requiredPlan === 'professional' ? 'Professional' : requiredPlan === 'enterprise' ? 'Enterprise' : 'Starter';

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Lock className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-xl font-bold mb-2">
        {feature ?? 'This feature'} requires {planLabel}
      </h2>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        Upgrade your plan to unlock {feature?.toLowerCase() ?? 'this feature'} and all {planLabel} capabilities.
      </p>
      <Button asChild>
        <Link to="/settings?tab=billing">
          <Sparkles className="h-4 w-4 mr-2" />
          View plans &amp; upgrade
        </Link>
      </Button>
    </div>
  );
}
