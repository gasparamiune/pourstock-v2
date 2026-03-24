import { useState } from 'react';
import { BarChart3, TrendingDown, DollarSign, Calendar, BedDouble, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useRooms, useReservations } from '@/hooks/useReception';
import { useHousekeepingTasks } from '@/hooks/useHousekeeping';
import { useDashboardData } from '@/hooks/useInventoryData';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionGate } from '@/components/auth/SubscriptionGate';
import { cn } from '@/lib/utils';
import { subDays, format, eachDayOfInterval, parseISO, differenceInCalendarDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ReportType = 'occupancy' | 'housekeeping' | 'inventory' | 'revenue';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('occupancy');
  const [dateRange, setDateRange] = useState('7d');
  const { t } = useLanguage();
  const { activeHotelId } = useAuth();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const days = dateRange === '90d' ? 90 : dateRange === '30d' ? 30 : 7;
  const fromDate = subDays(today, days - 1);
  const fromStr = fromDate.toISOString().split('T')[0];

  const { data: rooms } = useRooms();
  const { data: reservations = [] } = useReservations({ from: fromStr, to: todayStr });
  const { data: hkTasks } = useHousekeepingTasks();
  const { products, lowStockAlerts } = useDashboardData();

  // Fetch room charges for revenue
  const { data: allCharges = [] } = useQuery({
    queryKey: ['all-charges-report', activeHotelId, fromStr, todayStr],
    queryFn: async () => {
      if (!activeHotelId) return [];
      const { data } = await supabase
        .from('room_charges')
        .select('*')
        .eq('hotel_id' as any, activeHotelId)
        .gte('created_at', `${fromStr}T00:00:00`)
        .lte('created_at', `${todayStr}T23:59:59`);
      return data ?? [];
    },
    enabled: !!activeHotelId,
  });

  // ── Occupancy ─────────────────────────────────────────────────────────────
  const totalRooms = rooms?.length ?? 0;
  const occupied = rooms?.filter(r => r.status === 'occupied').length ?? 0;
  const available = rooms?.filter(r => r.status === 'available').length ?? 0;
  const maintenance = rooms?.filter(r => r.status === 'maintenance').length ?? 0;
  const checkout = rooms?.filter(r => r.status === 'checkout').length ?? 0;

  const roomStatusData = [
    { name: 'Available', value: available, color: 'hsl(142, 71%, 45%)' },
    { name: 'Occupied', value: occupied, color: 'hsl(199, 89%, 48%)' },
    { name: 'Checkout', value: checkout, color: 'hsl(38, 92%, 50%)' },
    { name: 'Maintenance', value: maintenance, color: 'hsl(0, 72%, 51%)' },
  ].filter(d => d.value > 0);

  // Real occupancy trend from reservation data
  const dateInterval = eachDayOfInterval({ start: fromDate, end: today });
  const occupancyTrend = dateInterval.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLabel = format(date, days <= 7 ? 'EEE' : 'dd/MM');
    const activeCount = (reservations as any[]).filter((r) => {
      const ci = r.check_in_date;
      const co = r.check_out_date;
      return ci <= dateStr && co > dateStr && ['confirmed', 'checked_in', 'checked_out'].includes(r.status);
    }).length;
    const occupancy = totalRooms > 0 ? Math.round((activeCount / totalRooms) * 100) : 0;
    return { day: dayLabel, occupancy };
  });

  // ── Housekeeping ──────────────────────────────────────────────────────────
  const hkDirty = (hkTasks || []).filter(t => t.status === 'dirty').length;
  const hkInProgress = (hkTasks || []).filter(t => t.status === 'in_progress').length;
  const hkClean = (hkTasks || []).filter(t => t.status === 'clean').length;
  const hkInspected = (hkTasks || []).filter(t => t.status === 'inspected').length;

  const hkData = [
    { name: t('housekeeping.dirty'), count: hkDirty, fill: 'hsl(0, 72%, 51%)' },
    { name: t('housekeeping.inProgress'), count: hkInProgress, fill: 'hsl(38, 92%, 50%)' },
    { name: t('housekeeping.clean'), count: hkClean, fill: 'hsl(142, 71%, 45%)' },
    { name: t('housekeeping.inspected'), count: hkInspected, fill: 'hsl(199, 89%, 48%)' },
  ];

  // ── Inventory ─────────────────────────────────────────────────────────────
  const categoryStock = ['wine', 'beer', 'spirits', 'coffee', 'soda', 'syrup'].map(cat => ({
    name: t(`category.${cat}`),
    total: products.filter(p => p.category === cat).length,
    low: lowStockAlerts.filter(a => a.product.category === cat).length,
  }));

  // ── Revenue ───────────────────────────────────────────────────────────────
  const charges = allCharges as any[];
  const totalRevenue = charges.reduce((s, c) => s + (c.amount ?? 0), 0);
  const roomRevenue = charges.filter(c => c.charge_type === 'room_rate').reduce((s, c) => s + (c.amount ?? 0), 0);
  const barRevenue = charges.filter(c => c.charge_type === 'bar').reduce((s, c) => s + (c.amount ?? 0), 0);
  const otherRevenue = totalRevenue - roomRevenue - barRevenue;

  const revPAR = totalRooms > 0 && days > 0 ? (roomRevenue / (totalRooms * days)) : 0;

  // Daily revenue trend
  const revenueTrend = dateInterval.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLabel = format(date, days <= 7 ? 'EEE' : 'dd/MM');
    const dayRevenue = charges
      .filter(c => c.created_at?.startsWith(dateStr))
      .reduce((s, c) => s + (c.amount ?? 0), 0);
    return { day: dayLabel, revenue: dayRevenue };
  });

  // Payment status breakdown from reservations in range
  const paymentBreakdown = [
    { name: 'Paid', value: (reservations as any[]).filter(r => r.payment_status === 'paid').length, color: 'hsl(142, 71%, 45%)' },
    { name: 'Pending', value: (reservations as any[]).filter(r => r.payment_status === 'pending').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'Partial', value: (reservations as any[]).filter(r => r.payment_status === 'partial').length, color: 'hsl(199, 89%, 48%)' },
  ].filter(d => d.value > 0);

  const reports: { id: ReportType; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'occupancy', label: 'Occupancy', icon: BedDouble, desc: 'Room status & trends' },
    { id: 'housekeeping', label: 'Housekeeping', icon: Users, desc: 'Cleaning performance' },
    { id: 'inventory', label: 'Inventory', icon: TrendingDown, desc: 'Stock levels & alerts' },
    { id: 'revenue', label: 'Revenue', icon: DollarSign, desc: 'Financial overview' },
  ];

  const dateRanges = [
    { value: '7d', label: `7 ${t('reports.days')}` },
    { value: '30d', label: `30 ${t('reports.days')}` },
    { value: '90d', label: `90 ${t('reports.days')}` },
  ];

  const TOOLTIP_STYLE = { backgroundColor: 'hsl(220, 15%, 12%)', border: '1px solid hsl(220, 12%, 20%)' };
  const AXIS_STYLE = { stroke: 'hsl(220, 10%, 55%)', fontSize: 12 };
  const GRID_STYLE = { strokeDasharray: '3 3', stroke: 'hsl(220, 12%, 20%)' };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">{t('reports.title')}</h1>
          <p className="text-muted-foreground">{t('reports.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex bg-secondary rounded-lg p-1">
            {dateRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={cn(
                  'px-3 py-1 rounded-md text-sm transition-colors',
                  dateRange === range.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={cn(
                'glass-card rounded-2xl p-4 text-left transition-all touch-target',
                activeReport === report.id ? 'ring-2 ring-primary' : 'hover:bg-card/80'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                activeReport === report.id ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-medium">{report.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{report.desc}</p>
            </button>
          );
        })}
      </div>

      {/* ── Occupancy ── */}
      {activeReport === 'occupancy' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Room Status Now</CardTitle></CardHeader>
            <CardContent>
              {roomStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={roomStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {roomStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No room data</div>
              )}
              <div className="text-center mt-2">
                <p className="text-3xl font-bold">{totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0}%</p>
                <p className="text-sm text-muted-foreground">Current Occupancy</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Occupancy Trend ({dateRange})</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={occupancyTrend}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="day" {...AXIS_STYLE} />
                  <YAxis {...AXIS_STYLE} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, 'Occupancy']} />
                  <Line type="monotone" dataKey="occupancy" stroke="hsl(199, 89%, 48%)" strokeWidth={2} dot={{ fill: 'hsl(199, 89%, 48%)', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Housekeeping ── */}
      {activeReport === 'housekeeping' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Task Status Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hkData}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="name" {...AXIS_STYLE} />
                  <YAxis {...AXIS_STYLE} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {hkData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {hkData.map(item => (
                  <div key={item.name} className="p-4 rounded-xl bg-secondary/50 text-center">
                    <p className="text-2xl font-bold">{item.count}</p>
                    <p className="text-sm text-muted-foreground">{item.name}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-sm text-muted-foreground">Total tasks today</p>
                <p className="text-3xl font-bold">{(hkTasks || []).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Inventory ── */}
      {activeReport === 'inventory' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Stock by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryStock}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="name" {...AXIS_STYLE} fontSize={11} />
                  <YAxis {...AXIS_STYLE} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="low" name="Low Stock" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Stock Health</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                </div>
                <div className={cn('p-4 rounded-xl text-center', lowStockAlerts.length > 0 ? 'bg-warning/10' : 'bg-success/10')}>
                  <p className="text-2xl font-bold">{lowStockAlerts.length}</p>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                </div>
              </div>
              {lowStockAlerts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-warning">Items needing attention:</p>
                  {lowStockAlerts.slice(0, 5).map(alert => (
                    <div key={`${alert.product.id}-${alert.location.id}`} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-sm">
                      <span>{alert.product.name}</span>
                      <span className="text-warning font-medium">{alert.currentStock}/{alert.parLevel}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Revenue ── */}
      {activeReport === 'revenue' && (
        <SubscriptionGate requiredPlan="professional" feature="Revenue reports">
          <div className="space-y-6">
            {/* KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: `DKK ${totalRevenue.toLocaleString('da-DK', { maximumFractionDigits: 0 })}`, sub: `Last ${days} days` },
                { label: 'Room Revenue', value: `DKK ${roomRevenue.toLocaleString('da-DK', { maximumFractionDigits: 0 })}`, sub: 'Room rate charges' },
                { label: 'Bar Revenue', value: `DKK ${barRevenue.toLocaleString('da-DK', { maximumFractionDigits: 0 })}`, sub: 'Bar tab charges' },
                { label: 'RevPAR', value: `DKK ${revPAR.toLocaleString('da-DK', { maximumFractionDigits: 0 })}`, sub: 'Per available room/night' },
              ].map((kpi) => (
                <Card key={kpi.label} className="glass-card">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Daily revenue trend */}
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base">Daily Revenue ({dateRange})</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={revenueTrend}>
                      <CartesianGrid {...GRID_STYLE} />
                      <XAxis dataKey="day" {...AXIS_STYLE} />
                      <YAxis {...AXIS_STYLE} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`DKK ${v.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment status */}
              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base">Payment Status</CardTitle></CardHeader>
                <CardContent>
                  {paymentBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {paymentBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No reservations in range</div>
                  )}
                  <div className="mt-3 space-y-1.5">
                    {[
                      { label: 'Room rate', amount: roomRevenue, color: 'hsl(199, 89%, 48%)' },
                      { label: 'Bar', amount: barRevenue, color: 'hsl(38, 92%, 50%)' },
                      { label: 'Other', amount: otherRevenue, color: 'hsl(220, 10%, 55%)' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
                          <span className="text-muted-foreground">{row.label}</span>
                        </div>
                        <span className="font-medium">DKK {row.amount.toLocaleString('da-DK', { maximumFractionDigits: 0 })}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </SubscriptionGate>
      )}
    </div>
  );
}
