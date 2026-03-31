import { useState, lazy, Suspense, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MenuCatalog } from '@/components/restaurant/MenuCatalog';
import { toast } from 'sonner';
import {
  MapPin,
  Users,
  Link,
  Bell,
  Shield,
  FileText,
  ScrollText,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  UtensilsCrossed,
  BedDouble,
  Tag,
  Truck,
  Building2,
  RefreshCw,
  Blocks,
  Database,
  ChevronRight,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useLocations } from '@/hooks/useInventoryData';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHotelSettings } from '@/hooks/useHotelSettings';
import { cn } from '@/lib/utils';

const TableLayoutEditor = lazy(() => import('@/components/settings/TableLayoutEditor'));
const ParserProfileEditor = lazy(() => import('@/components/settings/ParserProfileEditor'));
const AuditLogViewer = lazy(() => import('@/components/settings/AuditLogViewer'));
const RestaurantSettings = lazy(() => import('@/components/settings/RestaurantSettings'));
const RoomTypeSettings = lazy(() => import('@/components/settings/RoomTypeSettings'));
const RoomCentre = lazy(() => import('@/components/settings/RoomCentre'));
const ProductCategorySettings = lazy(() => import('@/components/settings/ProductCategorySettings'));
const VendorSettings = lazy(() => import('@/components/settings/VendorSettings'));
const DepartmentSettings = lazy(() => import('@/components/settings/DepartmentSettings'));
const ReorderRuleSettings = lazy(() => import('@/components/settings/ReorderRuleSettings'));
const HotelModuleSettings = lazy(() => import('@/components/settings/HotelModuleSettings'));
const ReleaseManager = lazy(() => import('@/components/settings/ReleaseManager').then(m => ({ default: m.ReleaseManager })));
const BillingSettings = lazy(() => import('@/components/settings/BillingSettings').then(m => ({ default: m.BillingSettings })));

type SettingsSection = 'departments' | 'locations' | 'users' | 'roomTypes' | 'roomCentre' | 'restaurants' | 'productCategories' | 'vendors' | 'reorderRules' | 'hotelModules' | 'pos' | 'notifications' | 'tablePlan' | 'parserProfiles' | 'auditLogs' | 'dataProtection' | 'releases' | 'billing';

interface SectionGroup {
  label: string;
  items: { id: SettingsSection; label: string; icon: React.ElementType }[];
}

const sectionGroups: SectionGroup[] = [
  {
    label: 'General',
    items: [
      { id: 'departments', label: 'Departments', icon: Building2 },
      { id: 'locations', label: 'Locations', icon: MapPin },
      { id: 'users', label: 'Users & Roles', icon: Users },
      { id: 'hotelModules', label: 'Modules', icon: Blocks },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'roomCentre', label: 'Room Centre', icon: BedDouble },
      { id: 'roomTypes', label: 'Room Types', icon: BedDouble },
      { id: 'restaurants', label: 'Restaurants & Service', icon: UtensilsCrossed },
      { id: 'tablePlan', label: 'Table Plan', icon: Database },
      { id: 'parserProfiles', label: 'Parser Profiles', icon: FileText },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { id: 'productCategories', label: 'Categories', icon: Tag },
      { id: 'vendors', label: 'Vendors', icon: Truck },
      { id: 'reorderRules', label: 'Reorder Rules', icon: RefreshCw },
      { id: 'pos', label: 'POS Integration', icon: Link },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'auditLogs', label: 'Audit Logs', icon: ScrollText },
      { id: 'dataProtection', label: 'Data Protection', icon: Shield },
      { id: 'releases', label: 'Release Notes', icon: Bell },
    ],
  },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('departments');
  const { t } = useLanguage();
  const { getSetting, updateSetting } = useHotelSettings();
  const { locations } = useLocations();
  const { user, profile, activeHotelId } = useAuth();

  const { data: hotelStripe, refetch: refetchStripe } = useQuery({
    queryKey: ['hotel-stripe', activeHotelId],
    queryFn: async () => {
      const { data } = await supabase
        .from('hotels' as any)
        .select('stripe_connect_completed, stripe_account_id')
        .eq('id', activeHotelId)
        .single();
      return (data as unknown) as { stripe_connect_completed: boolean; stripe_account_id: string | null } | null;
    },
    enabled: !!activeHotelId,
  });

  async function handleStripeConnect() {
    const res = await supabase.functions.invoke('stripe-connect', {
      body: { action: 'authorize-url', hotel_id: activeHotelId },
    });
    if (res.data?.url) window.location.href = res.data.url;
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_callback') === '1') {
      const code = params.get('code');
      const state = params.get('state');
      if (code && state) {
        supabase.functions
          .invoke('stripe-connect', { body: { action: 'callback', code, state } })
          .then(() => {
            refetchStripe();
            window.history.replaceState({}, '', '/settings');
            toast.success('Stripe account connected!');
          });
      }
    }
  }, []);

  const autoSave = getSetting('auto_save_table_plan', true);
  const dataRetentionDays = getSetting('data_retention_days', 365);

  // Find current section label
  const currentItem = sectionGroups.flatMap(g => g.items).find(i => i.id === activeSection);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Grouped Sidebar */}
        <div className="space-y-6">
          {sectionGroups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left text-sm",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl p-6">
          {activeSection === 'locations' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-lg">{t('settings.locations')}</h2>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('settings.addLocation')}
                </Button>
              </div>
              <div className="space-y-3">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        location.is_active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{location.name}</h3>
                        {location.description && <p className="text-sm text-muted-foreground">{location.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={location.is_active} />
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-lg">{t('settings.usersRoles')}</h2>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('settings.inviteUser')}
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-medium">{(profile?.full_name || user?.email || '?').charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium">{profile?.full_name || 'Current User'}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium capitalize">admin</span>
                </div>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">{t('settings.rolePermissions')}</h4>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li><strong>Admin:</strong> {t('settings.adminDesc')}</li>
                      <li><strong>Manager:</strong> {t('settings.managerDesc')}</li>
                      <li><strong>Staff:</strong> {t('settings.staffDesc')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'pos' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-lg">{t('settings.posIntegration')}</h2>
              </div>
              <div className="rounded-xl border border-border/50 bg-secondary/30 p-8 text-center">
                <Blocks className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <h3 className="font-semibold text-base mb-1">POS Integration — Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Native integrations with popular POS systems are planned for a future release.
                  Bar charges are currently tracked directly in PourStock via the Bar module.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-6">{t('settings.notifications')}</h2>
              <div className="space-y-4">
                {[
                  { title: t('settings.lowStockAlerts'), desc: t('settings.lowStockAlertsDesc'), defaultChecked: true },
                  { title: t('settings.varianceAlerts'), desc: t('settings.varianceAlertsDesc'), defaultChecked: true },
                  { title: t('settings.orderReminders'), desc: t('settings.orderRemindersDesc'), defaultChecked: false },
                  { title: t('settings.countReminders'), desc: t('settings.countRemindersDesc'), defaultChecked: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={item.defaultChecked} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'tablePlan' && (
            <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
              <TableLayoutEditor />
            </Suspense>
          )}

          {activeSection === 'restaurants' && (
            <div className="space-y-8">
              <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
                <RestaurantSettings />
              </Suspense>

              {/* Stripe Connect */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Payment Processing (Stripe Terminal)</h3>
                {hotelStripe?.stripe_connect_completed ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Stripe account connected ({hotelStripe.stripe_account_id})
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Connect your Stripe account so card payments via Terminal go directly to your bank.
                    </p>
                    <Button onClick={handleStripeConnect} variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Stripe
                    </Button>
                  </div>
                )}
              </div>

              {/* Menu Catalog */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Menu Catalog</h3>
                <p className="text-sm text-muted-foreground">
                  Configure your menu items here. The kitchen can load these into any day's menu with one click.
                </p>
                <MenuCatalog />
              </div>
            </div>
          )}

          {activeSection === 'roomCentre' && (
            <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
              <RoomCentre />
            </Suspense>
          )}

          {activeSection === 'roomTypes' && (
            <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
              <RoomTypeSettings />
            </Suspense>
          )}

          {activeSection === 'productCategories' && (
            <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
              <ProductCategorySettings />
            </Suspense>
          )}

          {activeSection === 'vendors' && (
            <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
              <VendorSettings />
            </Suspense>
          )}

          {activeSection === 'departments' && (
            <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
              <DepartmentSettings />
            </Suspense>
          )}

          {activeSection === 'reorderRules' && (
            <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
              <ReorderRuleSettings />
            </Suspense>
          )}

          {activeSection === 'hotelModules' && (
            <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
              <HotelModuleSettings />
            </Suspense>
          )}

          {activeSection === 'parserProfiles' && (
            <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
              <ParserProfileEditor />
            </Suspense>
          )}

          {activeSection === 'auditLogs' && (
            <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
              <AuditLogViewer />
            </Suspense>
          )}

          {activeSection === 'dataProtection' && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-6">Data Protection</h2>
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h3 className="font-medium mb-2">Guest Data Retention</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Guest personal data will be automatically anonymized after the retention period expires.
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={30}
                      max={3650}
                      value={dataRetentionDays}
                      onChange={(e) => {
                        const days = parseInt(e.target.value);
                        if (days >= 30 && days <= 3650) {
                          updateSetting.mutate({ key: 'data_retention_days', value: days });
                        }
                      }}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h3 className="font-medium mb-2">Passport Numbers</h3>
                  <p className="text-sm text-muted-foreground">
                    Only the last 4 digits and country code are kept. Full passport numbers are never stored permanently.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h3 className="font-medium mb-2">Audit Logs</h3>
                  <p className="text-sm text-muted-foreground">
                    Retained for a minimum of 2 years for compliance. After that, user references are anonymized.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Reservation PDFs</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Uploaded reservation PDFs are processed in-memory only and are never stored permanently.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'billing' && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-6">Billing &amp; Plan</h2>
              <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
                <BillingSettings />
              </Suspense>
            </div>
          )}

          {activeSection === 'releases' && (
            <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
              <ReleaseManager />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
