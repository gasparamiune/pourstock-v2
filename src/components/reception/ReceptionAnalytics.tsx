import { useMemo } from 'react';
import { useRooms, useReservations } from '@/hooks/useReception';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, BedDouble, ArrowDownToLine, ArrowUpFromLine, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, addDays, parseISO, differenceInCalendarDays } from 'date-fns';

function currencyDKK(amount: number) {
  return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(amount);
}

// ── Stats card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card className="glass-card border-border/50">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ?? 'bg-primary/10'}`}>
            <Icon className={`h-5 w-5 ${accent ? 'text-white' : 'text-primary'}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-bold text-xl leading-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ReceptionAnalytics() {
  const today = new Date().toISOString().split('T')[0];
  const from14 = addDays(new Date(), -7).toISOString().split('T')[0];
  const to14   = addDays(new Date(), 14).toISOString().split('T')[0];

  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: reservations = [], isLoading: resLoading } = useReservations({ from: from14, to: to14 });

  const stats = useMemo(() => {
    const totalRooms = (rooms as any[]).length;
    const occupiedRooms = (rooms as any[]).filter((r) => r.status === 'occupied').length;
    const occupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    const checkedIn = (reservations as any[]).filter((r) => r.status === 'checked_in');
    const totalRevenue = checkedIn.reduce((sum: number, r: any) => {
      const nights = Math.max(1, differenceInCalendarDays(new Date(r.check_out_date), new Date(r.check_in_date)));
      return sum + (r.rate_per_night ?? 0) * nights;
    }, 0);

    const revPAR = totalRooms > 0 && occupiedRooms > 0
      ? totalRevenue / totalRooms
      : 0;

    const adr = occupiedRooms > 0 ? totalRevenue / occupiedRooms : 0;

    // Next 14 days forecast
    const forecast = Array.from({ length: 14 }, (_, i) => {
      const day = addDays(new Date(), i);
      const dayStr = day.toISOString().split('T')[0];
      const arrivals = (reservations as any[]).filter((r) => r.check_in_date === dayStr).length;
      const departures = (reservations as any[]).filter((r) => r.check_out_date === dayStr).length;
      return {
        day: format(day, 'EEE d'),
        arrivals,
        departures,
        isToday: dayStr === today,
      };
    });

    const todayArrivals = (reservations as any[]).filter((r) => r.check_in_date === today && r.status === 'confirmed').length;
    const todayDepartures = (reservations as any[]).filter((r) => r.check_out_date === today && r.status === 'checked_in').length;

    return { occupancy, occupiedRooms, totalRooms, revPAR, adr, forecast, todayArrivals, todayDepartures };
  }, [rooms, reservations, today]);

  if (roomsLoading || resLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={BedDouble}
          label="Occupancy"
          value={`${stats.occupancy}%`}
          sub={`${stats.occupiedRooms} / ${stats.totalRooms} rooms`}
          accent={stats.occupancy >= 80 ? 'bg-green-500' : stats.occupancy >= 50 ? 'bg-amber-500' : undefined}
        />
        <StatCard
          icon={DollarSign}
          label="RevPAR"
          value={currencyDKK(stats.revPAR)}
          sub="Revenue per available room"
        />
        <StatCard
          icon={ArrowDownToLine}
          label="Arrivals today"
          value={String(stats.todayArrivals)}
          sub="Confirmed check-ins"
        />
        <StatCard
          icon={ArrowUpFromLine}
          label="Departures today"
          value={String(stats.todayDepartures)}
          sub="Due to check out"
        />
      </div>

      {/* 14-day forecast chart */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            14-Day Arrivals &amp; Departures Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.forecast} barGap={2} barCategoryGap="25%">
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={24} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
              />
              <Bar dataKey="arrivals" name="Arrivals" fill="hsl(var(--primary))" radius={[4,4,0,0]}>
                {stats.forecast.map((entry) => (
                  <Cell key={entry.day} fillOpacity={entry.isToday ? 1 : 0.6} />
                ))}
              </Bar>
              <Bar dataKey="departures" name="Departures" fill="hsl(var(--muted-foreground))" radius={[4,4,0,0]} fillOpacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Arrivals
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-muted-foreground/50 inline-block" /> Departures
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment status breakdown */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Payment Status (current stays)</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const checkedIn = (reservations as any[]).filter((r) => r.status === 'checked_in');
            const groups: Record<string, number> = {};
            checkedIn.forEach((r: any) => {
              groups[r.payment_status] = (groups[r.payment_status] ?? 0) + 1;
            });
            const colorMap: Record<string, string> = {
              paid: 'bg-green-500/15 text-green-600 border-green-500/30',
              pending: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
              partial: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
              refunded: 'bg-muted text-muted-foreground',
            };
            if (checkedIn.length === 0) return <p className="text-sm text-muted-foreground">No current stays.</p>;
            return (
              <div className="flex flex-wrap gap-2">
                {Object.entries(groups).map(([status, count]) => (
                  <Badge key={status} className={`text-sm border ${colorMap[status] ?? 'bg-muted'}`}>
                    {status} · {count}
                  </Badge>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
