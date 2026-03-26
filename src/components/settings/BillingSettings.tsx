import { CreditCard, CheckCircle, AlertTriangle, Clock, Zap, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSubscription } from '@/hooks/useSubscription';
import { format } from 'date-fns';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'DKK 799',
    period: '/mo',
    seats: 10,
    description: 'Perfect for small properties',
    features: ['Up to 10 staff members', 'Reception & Housekeeping', 'Basic analytics', 'Email support'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 'DKK 1,499',
    period: '/mo',
    seats: 30,
    description: 'Full-feature hotel management',
    features: ['Up to 30 staff members', 'All departments (Kitchen, Bar, Restaurant)', 'Advanced analytics', 'Document centre', 'Priority support'],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    seats: 999,
    description: 'Multi-property & custom integrations',
    features: ['Unlimited staff', 'Multi-property dashboard', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee'],
  },
] as const satisfies readonly { id: string; name: string; price: string; period: string; seats: number; description: string; features: readonly string[]; highlight?: boolean }[];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    trialing: { label: 'Trial', className: 'bg-primary/15 text-primary border-primary/30' },
    active: { label: 'Active', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
    past_due: { label: 'Past due', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
    canceled: { label: 'Canceled', className: 'bg-destructive/15 text-destructive border-destructive/30' },
    paused: { label: 'Paused', className: 'bg-muted text-muted-foreground border-border' },
  };
  const c = config[status] ?? config.paused;
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
}

export function BillingSettings() {
  const { subscription, isLoading, planLabel, isTrialing, trialDaysRemaining, trialExpired, seats } = useSubscription();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Card key={i}><CardContent className="p-6"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>Your subscription details and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-semibold">{planLabel}</span>
                {subscription && <StatusBadge status={subscription.status} />}
              </div>
              {isTrialing && trialDaysRemaining !== null && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {trialExpired
                    ? 'Trial expired — upgrade to continue'
                    : `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining in trial`}
                </p>
              )}
              {subscription?.trial_ends_at && isTrialing && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Trial ends {format(new Date(subscription.trial_ends_at), 'dd MMM yyyy')}
                </p>
              )}
              {subscription?.current_period_end && !isTrialing && (
                <p className="text-sm text-muted-foreground">
                  Next billing: {format(new Date(subscription.current_period_end), 'dd MMM yyyy')}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{seats} seats</span>
              </div>
            </div>
          </div>

          {subscription?.cancel_at_period_end && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Subscription will cancel at end of billing period
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="text-xs">
              Manage billing
              <span className="ml-1.5 text-muted-foreground">(Stripe portal — coming soon)</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <div>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Available Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = subscription?.plan === plan.id;
            return (
              <Card
                key={plan.id}
                className={`relative ${plan.highlight ? 'border-primary shadow-lg shadow-primary/10' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-2.5">Most popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <CardDescription className="text-xs">{plan.description}</CardDescription>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    size="sm"
                    variant={plan.highlight ? 'default' : 'outline'}
                    disabled={isCurrent}
                  >
                    {isCurrent ? 'Current plan' : plan.id === 'enterprise' ? 'Contact sales' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
