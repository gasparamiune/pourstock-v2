import { useState } from 'react';
import { BarChart3, TrendingDown, AlertTriangle, DollarSign, Calendar, BedDouble, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useRooms, useReservations } from '@/hooks/useReception';
import { useHousekeepingTasks } from '@/hooks/useHousekeeping';
import { useDashboardData } from '@/hooks/useInventoryData';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

type ReportType = 'occupancy' | 'housekeeping' | 'inventory' | 'revenue';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('occupancy');
  const [dateRange, setDateRange] = useState('7d');
  const { t } = useLanguage();
  const { isAdmin, hasDepartment } = useAuth();

  const { data: rooms } = useRooms();
  const today = new Date().toISOString().split('T')[0];
  const { data: reservations } = useReservations({ from: today, to: today });
  const { data: hkTasks } = useHousekeepingTasks();
  const { products, lowStockAlerts } = useDashboardData();

  // Derived data
  const totalRooms = rooms?.length ?? 0;
  const occupied = rooms?.filter(r => r.status === 'occupied').length ?? 0;
  const available = rooms?.filter(r => r.status === 'available').length ?? 0;
  const maintenance = rooms?.filter(r => r.status === 'maintenance').length ?? 0;
  const checkout = rooms?.filter(r => r.status === 'checkout').length ?? 0;

  const hkDirty = (hkTasks || []).filter(t => t.status === 'dirty').length;
  const hkInProgress = (hkTasks || []).filter(t => t.status === 'in_progress').length;
  const hkClean = (hkTasks || []).filter(t => t.status === 'clean').length;
  const hkInspected = (hkTasks || []).filter(t => t.status === 'inspected').length;

  const roomStatusData = [
    { name: 'Available', value: available, color: 'hsl(142, 71%, 45%)' },
    { name: 'Occupied', value: occupied, color: 'hsl(199, 89%, 48%)' },
    { name: 'Checkout', value: checkout, color: 'hsl(38, 92%, 50%)' },
    { name: 'Maintenance', value: maintenance, color: 'hsl(0, 72%, 51%)' },
  ].filter(d => d.value > 0);

  const hkData = [
    { name: t('housekeeping.dirty'), count: hkDirty, fill: 'hsl(0, 72%, 51%)' },
    { name: t('housekeeping.inProgress'), count: hkInProgress, fill: 'hsl(38, 92%, 50%)' },
    { name: t('housekeeping.clean'), count: hkClean, fill: 'hsl(142, 71%, 45%)' },
    { name: t('housekeeping.inspected'), count: hkInspected, fill: 'hsl(199, 89%, 48%)' },
  ];

  // Mock weekly occupancy trend
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const occupancyTrend = weekdays.map((day, i) => ({
    day,
    occupancy: Math.min(100, Math.round(40 + Math.random() * 50 + (i >= 4 ? 15 : 0))),
  }));

  const categoryStock = ['wine', 'beer', 'spirits', 'coffee', 'soda', 'syrup'].map(cat => ({
    name: t(`category.${cat}`),
    total: products.filter(p => p.category === cat).length,
    low: lowStockAlerts.filter(a => a.product.category === cat).length,
  }));

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

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
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
                  "px-3 py-1 rounded-md text-sm transition-colors",
                  dateRange === range.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={cn(
                "glass-card rounded-2xl p-4 text-left transition-all touch-target",
                activeReport === report.id ? "ring-2 ring-primary" : "hover:bg-card/80"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                activeReport === report.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-medium">{report.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{report.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      {activeReport === 'occupancy' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Room Status</CardTitle>
            </CardHeader>
            <CardContent>
              {roomStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={roomStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {roomStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No room data available</div>
              )}
              <div className="text-center mt-2">
                <p className="text-3xl font-bold">{totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0}%</p>
                <p className="text-sm text-muted-foreground">Current Occupancy</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Occupancy Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={occupancyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 20%)" />
                  <XAxis dataKey="day" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 15%, 12%)', border: '1px solid hsl(220, 12%, 20%)' }} />
                  <Line type="monotone" dataKey="occupancy" stroke="hsl(199, 89%, 48%)" strokeWidth={2} dot={{ fill: 'hsl(199, 89%, 48%)', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeReport === 'housekeeping' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Task Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 20%)" />
                  <XAxis dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 15%, 12%)', border: '1px solid hsl(220, 12%, 20%)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {hkData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
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

      {activeReport === 'inventory' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Stock by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryStock}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 20%)" />
                  <XAxis dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={11} />
                  <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 15%, 12%)', border: '1px solid hsl(220, 12%, 20%)' }} />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="low" name="Low Stock" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Stock Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                </div>
                <div className={cn("p-4 rounded-xl text-center", lowStockAlerts.length > 0 ? "bg-warning/10" : "bg-success/10")}>
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

      {activeReport === 'revenue' && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Revenue analytics coming soon</p>
              <p className="text-sm mt-1">Financial reports will be available once billing data is integrated.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
