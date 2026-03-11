import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Scan, Loader2, BedDouble, SprayCan, UtensilsCrossed, Users, LogIn, LogOut, AlertTriangle, Package, TrendingDown, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchAssistant } from '@/components/search/SearchAssistant';
import { useDashboardData } from '@/hooks/useInventoryData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useRooms, useReservations } from '@/hooks/useReception';
import { useHousekeepingTasks } from '@/hooks/useHousekeeping';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  variant?: 'default' | 'warning' | 'success' | 'primary' | 'info';
  subtext?: string;
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(function StatCard(
  { label, value, icon: Icon, variant = 'default', subtext },
  ref,
) {
  const variants = {
    default: 'bg-secondary/50',
    warning: 'bg-warning/10 border-warning/20',
    success: 'bg-success/10 border-success/20',
    primary: 'bg-primary/10 border-primary/20',
    info: 'bg-info/10 border-info/20',
  };
  const iconVariants = {
    default: 'bg-secondary text-muted-foreground',
    warning: 'bg-warning/20 text-warning',
    success: 'bg-success/20 text-success',
    primary: 'bg-primary/20 text-primary',
    info: 'bg-info/20 text-info',
  };

  return (
    <div ref={ref} className={cn("glass-card rounded-2xl p-4 border", variants[variant])}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", iconVariants[variant])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-display font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {subtext && <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>}
    </div>
  );
});

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAdmin, hasDepartment } = useAuth();

  const showReception = isAdmin || hasDepartment('reception');
  const showHousekeeping = isAdmin || hasDepartment('housekeeping');
  const showRestaurant = isAdmin || hasDepartment('restaurant');

  // Reception data
  const { data: rooms } = useRooms();
  const today = new Date().toISOString().split('T')[0];
  const { data: reservations } = useReservations({ from: today, to: today });

  // Housekeeping data
  const { data: hkTasks } = useHousekeepingTasks();

  // Inventory data
  const { products, lowStockAlerts, isLoading } = useDashboardData();

  // Derived stats
  const totalRooms = rooms?.length ?? 0;
  const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length ?? 0;
  const arrivalsToday = (reservations || []).filter(r => r.check_in_date === today && r.status === 'confirmed').length;
  const departuresToday = (reservations || []).filter(r => r.check_out_date === today && r.status === 'checked_in').length;

  const dirtyRooms = (hkTasks || []).filter(t => t.status === 'dirty').length;
  const cleanRooms = (hkTasks || []).filter(t => t.status === 'clean' || t.status === 'inspected').length;
  const inProgressRooms = (hkTasks || []).filter(t => t.status === 'in_progress').length;


  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchAssistant />
      </div>

      {/* Top-level Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {showReception && (
          <>
            <StatCard
              label={t('reception.arrivals')}
              value={arrivalsToday}
              icon={LogIn}
              variant={arrivalsToday > 0 ? 'info' : 'default'}
              subtext={t('reception.today')}
            />
            <StatCard
              label={t('reception.departures')}
              value={departuresToday}
              icon={LogOut}
              variant={departuresToday > 0 ? 'warning' : 'default'}
              subtext={t('reception.today')}
            />
          </>
        )}
        {showHousekeeping && (
          <StatCard
            label={t('housekeeping.dirty')}
            value={dirtyRooms}
            icon={SprayCan}
            variant={dirtyRooms > 0 ? 'warning' : 'success'}
            subtext={`${cleanRooms} ${t('housekeeping.clean').toLowerCase()}`}
          />
        )}
        {showRestaurant && (
          <StatCard
            label="Low Stock"
            value={lowStockAlerts.length}
            icon={TrendingDown}
            variant={lowStockAlerts.length > 0 ? 'warning' : 'success'}
            subtext={`${products.length} total items`}
          />
        )}
      </div>

      {/* Department Cards */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Reception Card */}
        {showReception && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center">
                  <BedDouble className="h-4 w-4 text-info" />
                </div>
                {t('nav.reception')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-xl font-bold">{occupiedRooms}/{totalRooms}</p>
                  <p className="text-xs text-muted-foreground">Occupied</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-xl font-bold">{totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0}%</p>
                  <p className="text-xs text-muted-foreground">Occupancy</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/reception')}>
                {t('nav.reception')} →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Housekeeping Card */}
        {showHousekeeping && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                  <SprayCan className="h-4 w-4 text-warning" />
                </div>
                {t('nav.housekeeping')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <span className="font-bold">{dirtyRooms}</span> {t('housekeeping.dirty')}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-warning/10 text-warning text-sm">
                  <span className="font-bold">{inProgressRooms}</span> {t('housekeeping.inProgress')}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-success/10 text-success text-sm">
                  <span className="font-bold">{cleanRooms}</span> {t('housekeeping.clean')}
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/housekeeping')}>
                {t('nav.housekeeping')} →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Restaurant/Inventory Card */}
        {showRestaurant && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                </div>
                {t('nav.restaurant') || 'Restaurant'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-xl font-bold">{products.length}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
                <div className={cn(
                  "p-3 rounded-xl text-center",
                  lowStockAlerts.length > 0 ? "bg-warning/10" : "bg-success/10"
                )}>
                  <p className="text-xl font-bold">{lowStockAlerts.length}</p>
                  <p className="text-xs text-muted-foreground">Low Stock</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button variant="secondary" size="sm" className="h-auto py-2 flex-col gap-1 text-xs" onClick={() => navigate('/inventory?mode=count')}>
                  <Play className="h-3.5 w-3.5" />
                  Count
                </Button>
                <Button variant="secondary" size="sm" className="h-auto py-2 flex-col gap-1 text-xs" onClick={() => navigate('/products?action=new')}>
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
                <Button variant="secondary" size="sm" className="h-auto py-2 flex-col gap-1 text-xs" onClick={() => navigate('/orders?action=receive')}>
                  <Scan className="h-3.5 w-3.5" />
                  Receive
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Low Stock Alerts (if any) */}
      {showRestaurant && lowStockAlerts.length > 0 && (
        <div className="mt-6">
          <Card className="glass-card border-warning/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Low Stock Alerts ({lowStockAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockAlerts.slice(0, 5).map((alert) => (
                  <div key={`${alert.product.id}-${alert.location.id}`} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                    <div>
                      <p className="font-medium text-sm">{alert.product.name}</p>
                      <p className="text-xs text-muted-foreground">{alert.location.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", alert.currentStock === 0 ? "text-destructive" : "text-warning")}>
                        {alert.currentStock} / {alert.parLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {lowStockAlerts.length > 5 && (
                <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => navigate('/inventory?filter=low')}>
                  View all {lowStockAlerts.length} alerts →
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
