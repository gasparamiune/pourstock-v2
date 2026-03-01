import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCutleryForType, type ReservationType } from './cutleryUtils';
import type { Reservation } from './TableCard';
import { UtensilsCrossed, GlassWater, Wine, Coffee } from 'lucide-react';

interface PreparationSummaryProps {
  reservations: Reservation[];
}

export function PreparationSummary({ reservations }: PreparationSummaryProps) {
  const { t } = useLanguage();

  const totalGuests = reservations.reduce((s, r) => s + r.guestCount, 0);
  const coffeeTeaCount = reservations.filter(r => r.coffeeTeaSweet).reduce((s, r) => s + r.guestCount, 0);

  // Calculate cutlery totals
  let totalForks = 0;
  let totalSteakKnives = 0;
  let totalButterKnives = 0;
  let totalSpoons = 0;

  for (const res of reservations) {
    const type = res.reservationType || (res.dishCount === 2 ? '2-ret' : '3-ret');
    const cutlery = getCutleryForType(type as ReservationType);
    totalForks += cutlery.forks * res.guestCount;
    totalSteakKnives += cutlery.steakKnives * res.guestCount;
    totalButterKnives += cutlery.butterKnives * res.guestCount;
    totalSpoons += cutlery.spoons * res.guestCount;
  }

  const items = [
    { icon: '🍴', label: t('prep.forks'), count: totalForks },
    { icon: '🔪', label: t('prep.steakKnives'), count: totalSteakKnives },
    { icon: '🧈', label: t('prep.butterKnives'), count: totalButterKnives },
    { icon: '🥄', label: t('prep.spoons'), count: totalSpoons },
  ];

  const glasses = [
    { icon: <GlassWater className="h-4 w-4" />, label: t('prep.waterGlass'), count: totalGuests },
    { icon: <Wine className="h-4 w-4 text-amber-200" />, label: t('prep.whiteWine'), count: totalGuests },
    { icon: <Wine className="h-4 w-4 text-red-400" />, label: t('prep.redWine'), count: totalGuests },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5" />
          {t('prep.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Cutlery */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{t('prep.cutlery')}</h4>
            <div className="space-y-1.5">
              {items.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="font-semibold tabular-nums">× {item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Glassware */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{t('prep.glassware')}</h4>
            <div className="space-y-1.5">
              {glasses.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                  <span className="font-semibold tabular-nums">× {item.count}</span>
                </div>
              ))}
            </div>

            {/* Coffee/tea */}
            {coffeeTeaCount > 0 && (
              <div className="pt-2 border-t border-border mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-amber-400" />
                    {t('prep.coffeeTea')}
                  </span>
                  <span className="font-semibold tabular-nums">× {coffeeTeaCount}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
