import { useRooms, useReservations } from '@/hooks/useReception';
import { useProducts } from '@/hooks/useInventoryData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Wine, TrendingUp, Receipt, Package } from 'lucide-react';

export function BarReport() {
  const { activeHotelId } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  // Fetch bar charges for today
  const { data: barCharges = [] } = useQuery({
    queryKey: ['bar-charges', activeHotelId, today],
    queryFn: async () => {
      if (!activeHotelId) return [];
      const { data, error } = await supabase
        .from('room_charges')
        .select('*')
        .eq('hotel_id' as any, activeHotelId)
        .eq('charge_type', 'bar')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId,
  });

  const totalRevenue = (barCharges as any[]).reduce((s, c) => s + (c.amount ?? 0), 0);
  const tabCount = new Set((barCharges as any[]).map((c: any) => c.reservation_id)).size;

  // Parse product names from descriptions like "Bar: Carlsberg ×2"
  const productCounts: Record<string, number> = {};
  for (const charge of barCharges as any[]) {
    const match = (charge.description ?? '').match(/Bar: (.+) ×(\d+)/);
    if (match) {
      const name = match[1];
      const qty = parseInt(match[2], 10);
      productCounts[name] = (productCounts[name] ?? 0) + qty;
    }
  }
  const topProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card border-border/50">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="flex justify-center mb-1"><TrendingUp className="h-4 w-4 text-primary" /></div>
            <p className="text-2xl font-bold">DKK {totalRevenue.toLocaleString('da-DK', { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Today's Revenue</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="flex justify-center mb-1"><Receipt className="h-4 w-4 text-primary" /></div>
            <p className="text-2xl font-bold">{tabCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tabs Closed</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="flex justify-center mb-1"><Package className="h-4 w-4 text-primary" /></div>
            <p className="text-2xl font-bold">{(barCharges as any[]).length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Charge Lines</p>
          </CardContent>
        </Card>
      </div>

      {/* Top products chart */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Top Products Today</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Wine className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No bar charges recorded today.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 20%)" horizontal={false} />
                <XAxis type="number" stroke="hsl(220, 10%, 55%)" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(220, 15%, 12%)', border: '1px solid hsl(220, 12%, 20%)' }}
                  formatter={(v: number) => [`${v} served`, 'Qty']}
                />
                <Bar dataKey="count" fill="hsl(199, 89%, 48%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
