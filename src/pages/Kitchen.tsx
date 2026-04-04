import { useState } from 'react';
import { ChefHat, UtensilsCrossed, Eye, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KitchenDisplay } from '@/components/kitchen/KitchenDisplay';
import { DailyMenuEditor } from '@/components/kitchen/DailyMenuEditor';
import { WaiterDisplay } from '@/components/kitchen/WaiterDisplay';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Kitchen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('kds');
  const today = new Date().toLocaleDateString('da-DK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-3 sm:p-4 border-b border-border/30">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <ChefHat className="h-6 w-6 text-primary" />
          {t('kitchen.title')}
        </h1>
        <p className="text-xs text-muted-foreground capitalize">{today}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 sm:px-4 pt-2">
          <TabsList className="h-8">
            <TabsTrigger value="kds" className="text-xs gap-1.5">
              <ChefHat className="h-3.5 w-3.5" />
              {t('kitchen.kds')}
            </TabsTrigger>
            <TabsTrigger value="waiter" className="text-xs gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {t('kitchen.waiterSide')}
            </TabsTrigger>
            <TabsTrigger value="menu" className="text-xs gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {t('kitchen.menuEditor')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kds" className="flex-1 overflow-auto p-3 sm:p-4 mt-0">
          <KitchenDisplay />
        </TabsContent>

        <TabsContent value="waiter" className="flex-1 overflow-auto p-3 sm:p-4 mt-0">
          <WaiterDisplay />
        </TabsContent>

        <TabsContent value="menu" className="flex-1 overflow-auto p-3 sm:p-4 mt-0">
          <DailyMenuEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
