import { ReactNode, useState } from 'react';
import { ReleaseAnnouncementDialog } from '@/components/ReleaseAnnouncementDialog';
import { SystemBanner } from '@/components/layout/SystemBanner';
import { useAppSidebar } from '@/contexts/SidebarContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Search,
  Bell,
  User,
  LogOut,
  Upload,
  LayoutGrid,
  Users,
  BedDouble,
  SprayCan,
  ChevronDown,
  UtensilsCrossed,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { usePendingChanges } from '@/hooks/usePendingChanges';
import { useHotelModules } from '@/hooks/useHotelModules';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ElementType;
  requireAdmin?: boolean;
  requireManager?: boolean;
  department?: 'reception' | 'housekeeping' | 'restaurant';
  departments?: readonly ('reception' | 'housekeeping' | 'restaurant')[];
  module?: string;
  group: 'main' | 'operations' | 'inventory' | 'admin' | 'system';
}

const navItems: NavItem[] = [
  // Main
  { path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, group: 'main' },

  // Operations
  { path: '/reception', labelKey: 'nav.reception', icon: BedDouble, department: 'reception', group: 'operations' },
  { path: '/housekeeping', labelKey: 'nav.housekeeping', icon: SprayCan, department: 'housekeeping', group: 'operations' },
  { path: '/table-plan', labelKey: 'nav.tablePlan', icon: LayoutGrid, departments: ['restaurant', 'reception'] as const, module: 'table_plan', group: 'operations' },

  // Inventory & Procurement
  { path: '/inventory', labelKey: 'nav.inventory', icon: Package, department: 'restaurant', module: 'inventory', group: 'inventory' },
  { path: '/products', labelKey: 'nav.products', icon: ClipboardList, department: 'restaurant', module: 'inventory', group: 'inventory' },
  { path: '/import', labelKey: 'nav.import', icon: Upload, department: 'restaurant', module: 'table_plan', group: 'inventory' },
  { path: '/orders', labelKey: 'nav.orders', icon: ShoppingCart, department: 'restaurant', module: 'procurement', group: 'inventory' },

  // Admin
  { path: '/reports', labelKey: 'nav.reports', icon: BarChart3, department: 'restaurant', module: 'reports', group: 'admin' },
  { path: '/user-management', labelKey: 'nav.userManagement', icon: Users, requireManager: true, group: 'admin' },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings, requireAdmin: true, group: 'admin' },

  // System
  { path: '/updates', labelKey: 'nav.updates', icon: Sparkles, group: 'system' },
];

const groupLabels: Record<string, string> = {
  main: '',
  operations: 'Operations',
  inventory: 'Inventory',
  admin: 'Administration',
  system: 'System',
};

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { desktopOpen, toggleDesktop } = useAppSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, roles, signOut, isAdmin, isManager, hasDepartment } = useAuth();
  const { t } = useLanguage();
  const { isModuleEnabled } = useHotelModules();
  const isRestaurant = isAdmin || hasDepartment('restaurant');
  const { pendingCount, dismissed, dismiss } = usePendingChanges();
  const showPendingBanner = isRestaurant && pendingCount > 0 && !dismissed && !location.pathname.startsWith('/table-plan');

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const displayName = profile?.full_name || profile?.email || user?.email || 'User';
  const userRole = roles[0] || 'staff';

  const filteredNavItems = navItems.filter((item) => {
    if (item.requireAdmin && !isAdmin) return false;
    if (item.requireManager && !isManager) return false;
    if (item.module && !isModuleEnabled(item.module)) return false;
    if (item.departments) {
      return item.departments.some(d => hasDepartment(d));
    }
    if (item.department && !hasDepartment(item.department)) return false;
    return true;
  });

  // Group items
  const groupedNav = ['main', 'operations', 'inventory', 'admin', 'system']
    .map(group => ({
      key: group,
      label: groupLabels[group],
      items: filteredNavItems.filter(i => i.group === group),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-border z-50 px-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="touch-target">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">PourStock</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="touch-target">
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300",
        desktopOpen ? "lg:translate-x-0" : "lg:-translate-x-full",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg text-sidebar-foreground">PourStock</span>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
            {groupedNav.map((group) => (
              <div key={group.key}>
                {group.label && (
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 px-4 mb-1.5">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 touch-target",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary font-medium"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                        <span className="text-sm">{t(item.labelKey)}</span>
                        {item.path === '/table-plan' && isRestaurant && pendingCount > 0 && (
                          <Badge className="ml-auto bg-amber-500 text-white text-xs px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center">
                            {pendingCount}
                          </Badge>
                        )}
                        {isActive && !(item.path === '/table-plan' && pendingCount > 0) && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Language Switcher */}
          <div className="px-4 pb-2">
            <LanguageSwitcher />
          </div>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-sm truncate">{displayName}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        isAdmin && "border-primary text-primary",
                        isManager && !isAdmin && "border-[hsl(var(--info))] text-[hsl(var(--info))]"
                      )}
                    >
                      {userRole}
                    </Badge>
                  </div>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('auth.myAccount')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('nav.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "pt-16 lg:pt-0 min-h-screen transition-[margin] duration-300",
        desktopOpen ? "lg:ml-72" : "lg:ml-0"
      )}>
        <div className="hidden lg:flex fixed top-3 z-50 transition-[left] duration-300" style={{ left: desktopOpen ? '18.5rem' : '0.75rem' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDesktop}
            className="h-8 w-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border shadow-sm hover:bg-card"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        {showPendingBanner && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-amber-500" />
              <span className="text-foreground">
                {pendingCount} {t('changeRequest.pendingNotification') || 'ventende ændringsanmodning(er) på bordplanen'}
              </span>
              <Link to="/table-plan" className="text-primary hover:underline font-medium ml-1">
                {t('changeRequest.viewNow') || 'Se nu →'}
              </Link>
            </div>
            <Button variant="ghost" size="sm" onClick={dismiss} className="text-muted-foreground h-7 text-xs">
              {t('changeRequest.gotIt') || 'Forstået'}
            </Button>
          </div>
        )}
        <SystemBanner />
        {children}
      </main>

      <ReleaseAnnouncementDialog />
    </div>
  );
}
