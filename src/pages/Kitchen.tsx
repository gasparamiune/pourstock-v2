import { useState } from 'react';
import { ChefHat } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KitchenDisplay } from '@/components/kitchen/KitchenDisplay';
import { DailyMenuEditor } from '@/components/kitchen/DailyMenuEditor';

export default function Kitchen() {
  const [activeTab, setActiveTab] = useState('kds');
  const today = new Date().toLocaleDateString('da-DK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <ChefHat className="h-7 w-7 text-primary" />
          Kitchen
        </h1>
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kds">Kitchen Display</TabsTrigger>
          <TabsTrigger value="menu">Today's Menu</TabsTrigger>
        </TabsList>

        <TabsContent value="kds" className="mt-4">
          <KitchenDisplay />
        </TabsContent>

        <TabsContent value="menu" className="mt-4">
          <DailyMenuEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
