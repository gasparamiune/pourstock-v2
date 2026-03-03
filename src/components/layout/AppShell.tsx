import { ReactNode, useState } from 'react';
import { UpdateAlert } from '@/components/UpdateAlert';
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
  UtensilsCrossed
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
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
}

const navItems: NavItem[] = [
  { path: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { path: '/inventory', labelKey: 'nav.inventory', icon: Package, department: 'restaurant' },
  { path: '/products', labelKey: 'nav.products', icon: ClipboardList, department: 'restaurant' },
  { path: '/import', labelKey: 'nav.import', icon: Upload, department: 'restaurant' },
  { path: '/table-plan', labelKey: 'nav.tablePlan', icon: LayoutGrid, department: 'restaurant' },
  { path: '/orders', labelKey: 'nav.orders', icon: ShoppingCart, department: 'restaurant' },
  { path: '/reports', labelKey: 'nav.reports', icon: BarChart3, department: 'restaurant' },
  { path: '/user-management', labelKey: 'nav.userManagement', icon: Users, requireManager: true },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings, requireAdmin: true },
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, roles, signOut, isAdmin, isManager, hasDepartment } = useAuth();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const displayName = profile?.full_name || profile?.email || user?.email || 'User';
  const userRole = roles[0] || 'staff';

  const filteredNavItems = navItems.filter((item) => {
    if (item.requireAdmin && !isAdmin) return false;
    if (item.requireManager && !isManager) return false;
    if (item.department && !hasDepartment(item.department)) return false;
    return true;
  });

  const allDepartments = [
    { key: 'reception', label: t('nav.reception'), icon: BedDouble, path: '/reception' },
    { key: 'housekeeping', label: t('nav.housekeeping'), icon: SprayCan, path: '/housekeeping' },
    { key: 'restaurant', label: t('nav.restaurant') || 'Restaurant', icon: UtensilsCrossed, path: '/inventory' },
  ] as const;

  const availableDepartments = allDepartments.filter(
    (d) => isAdmin || hasDepartment(d.key as 'reception' | 'housekeeping' | 'restaurant')
  );

  const currentDept = availableDepartments.find((d) =>
    location.pathname.startsWith(d.path) || 
    (d.key === 'restaurant' && ['/inventory', '/products', '/import', '/table-plan', '/orders', '/reports'].some(p => location.pathname.startsWith(p)))
  );
  const activeDeptLabel = currentDept?.label || t('nav.hotelOps') || 'Hotel Operations';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-border z-50 px-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsSidebarOpen(true)}
          className="touch-target"
        >
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
        <div 
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300",
          "lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-display font-bold text-lg text-sidebar-foreground">PourStock</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-sidebar-foreground transition-colors">
                      <span>{activeDeptLabel}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel className="text-xs">{t('nav.departments') || 'Departments'}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableDepartments.map((dept) => (
                      <DropdownMenuItem
                        key={dept.path}
                        onClick={() => { navigate(dept.path); setIsSidebarOpen(false); }}
                        className={cn(location.pathname === dept.path && "bg-accent font-medium")}
                      >
                        <dept.icon className="mr-2 h-4 w-4" />
                        {dept.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 touch-target",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-primary font-medium" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span>{t(item.labelKey)}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
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
                    <div className="flex items-center gap-2">
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
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>

      <UpdateAlert userName={profile?.full_name} />
    </div>
  );
}
