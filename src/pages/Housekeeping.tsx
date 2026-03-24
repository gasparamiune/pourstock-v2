import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { HKStatusBoard } from '@/components/housekeeping/HKStatusBoard';
import { MyTasksList } from '@/components/housekeeping/MyTasksList';
import { HKOverview } from '@/components/housekeeping/HKOverview';
import { HKAssignmentBoard } from '@/components/housekeeping/HKAssignmentBoard';
import { HKInspectionQueue } from '@/components/housekeeping/HKInspectionQueue';
import { HKFloorMap } from '@/components/housekeeping/HKFloorMap';
import { HKPerformanceDashboard } from '@/components/housekeeping/HKPerformanceDashboard';
import { LayoutDashboard, Grid3X3, ClipboardList, Users, CheckSquare, BarChart3, Settings, Map, TrendingUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Housekeeping() {
  const { t } = useLanguage();
  const { isAdmin, isManager, isDepartmentManager, hasDepartment } = useAuth();
  const isMobile = useIsMobile();

  const isSupervisor = isAdmin || isManager || isDepartmentManager('housekeeping');
  const isHKStaff = hasDepartment('housekeeping');

  const defaultTab = isMobile && !isSupervisor ? 'mytasks' : isSupervisor ? 'overview' : 'board';
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="p-4 lg:p-8 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">{t('housekeeping.title')}</h1>
        <p className="text-muted-foreground">{t('housekeeping.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="overflow-x-auto flex w-full justify-start">
          {isSupervisor && (
            <TabsTrigger value="overview" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">{t('housekeeping.overview')}</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="board" className="gap-1.5">
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('housekeeping.statusBoard')}</span>
          </TabsTrigger>
          {isSupervisor && (
            <TabsTrigger value="assign" className="gap-1.5">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t('housekeeping.assign')}</span>
            </TabsTrigger>
          )}
          {isHKStaff && (
            <TabsTrigger value="mytasks" className="gap-1.5">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">{t('housekeeping.myTasks')}</span>
            </TabsTrigger>
          )}
          {isSupervisor && (
            <TabsTrigger value="inspect" className="gap-1.5">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t('housekeeping.inspect')}</span>
            </TabsTrigger>
          )}
          {isSupervisor && (
            <TabsTrigger value="reports" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.reports')}</span>
            </TabsTrigger>
          )}
          {isSupervisor && (
            <TabsTrigger value="floormap" className="gap-1.5">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Floor Map</span>
            </TabsTrigger>
          )}
          {isSupervisor && (
            <TabsTrigger value="performance" className="gap-1.5">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="settings" className="gap-1.5">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.settings')}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {isSupervisor && (
          <TabsContent value="overview" className="mt-4">
            <HKOverview onNavigateTab={handleNavigateTab} />
          </TabsContent>
        )}

        <TabsContent value="board" className="mt-4">
          <HKStatusBoard isSupervisor={isSupervisor} />
        </TabsContent>

        {isSupervisor && (
          <TabsContent value="assign" className="mt-4">
            <HKAssignmentBoard />
          </TabsContent>
        )}

        {isHKStaff && (
          <TabsContent value="mytasks" className="mt-4">
            <MyTasksList />
          </TabsContent>
        )}

        {isSupervisor && (
          <TabsContent value="inspect" className="mt-4">
            <HKInspectionQueue />
          </TabsContent>
        )}

        {isSupervisor && (
          <TabsContent value="reports" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              {t('housekeeping.reportsComingSoon')}
            </div>
          </TabsContent>
        )}

        {isSupervisor && (
          <TabsContent value="floormap" className="mt-4">
            <HKFloorMap />
          </TabsContent>
        )}

        {isSupervisor && (
          <TabsContent value="performance" className="mt-4">
            <HKPerformanceDashboard />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="settings" className="mt-4">
            <div className="text-center py-12 text-muted-foreground">
              {t('housekeeping.settingsComingSoon')}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
