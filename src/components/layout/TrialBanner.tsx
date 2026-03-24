import { Link } from 'react-router-dom';
import { AlertTriangle, Zap, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';

export function TrialBanner() {
  const { isTrialing, trialDaysRemaining, trialExpired, isLoading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || (!isTrialing && !trialExpired) || dismissed) return null;

  const urgent = trialDaysRemaining !== null && trialDaysRemaining <= 3;

  if (trialExpired) {
    return (
      <div className="bg-destructive text-destructive-foreground px-4 py-2.5 flex items-center gap-3 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="flex-1 font-medium">
          Your free trial has ended. Upgrade to keep using PourStock.
        </span>
        <Button size="sm" variant="secondary" asChild className="h-7 text-xs">
          <Link to="/settings?tab=billing">Upgrade now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`px-4 py-2 flex items-center gap-3 text-sm transition-colors ${
        urgent ? 'bg-amber-500 text-amber-950' : 'bg-primary/10 text-foreground border-b border-border'
      }`}
    >
      <Zap className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        {urgent ? (
          <><strong>{trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left</strong> on your free trial — upgrade to avoid interruption.</>
        ) : (
          <>Free trial · <strong>{trialDaysRemaining} days remaining</strong>. Explore all features.</>
        )}
      </span>
      <Button
        size="sm"
        variant={urgent ? 'default' : 'outline'}
        asChild
        className="h-7 text-xs shrink-0"
      >
        <Link to="/settings?tab=billing">
          {urgent ? 'Upgrade now' : 'View plans'}
        </Link>
      </Button>
      {!urgent && (
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
