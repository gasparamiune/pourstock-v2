import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wine, Receipt, BarChart3 } from 'lucide-react';
import { ActiveTabs } from '@/components/bar/ActiveTabs';
import { QuickService } from '@/components/bar/QuickService';
import { BarReport } from '@/components/bar/BarReport';

export default function Bar() {
  const [activeTab, setActiveTab] = useState('tabs');
  const today = new Date().toLocaleDateString('da-DK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="p-4 lg:p-8 space-y-4">
      <div className="flex items-center gap-3">
        <Wine className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Bar</h1>
          <p className="text-muted-foreground capitalize text-sm">{today}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="overflow-x-auto flex w-full justify-start">
          <TabsTrigger value="tabs" className="gap-1.5">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Active Tabs</span>
          </TabsTrigger>
          <TabsTrigger value="quick" className="gap-1.5">
            <Wine className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Service</span>
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Daily Report</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tabs" className="mt-4">
          <ActiveTabs />
        </TabsContent>
        <TabsContent value="quick" className="mt-4">
          <QuickService />
        </TabsContent>
        <TabsContent value="report" className="mt-4">
          <BarReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
