import { useState } from 'react';
import { ChefHat, UtensilsCrossed, Eye } from 'lucide-react';
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
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left panel: KDS / Waiter */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border/30">
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
            </TabsList>
          </div>

          <TabsContent value="kds" className="flex-1 overflow-auto p-3 sm:p-4 mt-0">
            <KitchenDisplay />
          </TabsContent>

          <TabsContent value="waiter" className="flex-1 overflow-auto p-3 sm:p-4 mt-0">
            <WaiterDisplay />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right panel: Menu editor (Chef de Cuisine) */}
      <div className="w-[380px] xl:w-[440px] flex flex-col overflow-hidden hidden lg:flex">
        <div className="p-3 sm:p-4 border-b border-border/30">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-primary" />
            {t('kitchen.menuEditor')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('kitchen.menuEditorSub')}</p>
        </div>
        <div className="flex-1 overflow-auto p-3 sm:p-4">
          <DailyMenuEditor />
        </div>
      </div>
    </div>
  );
}
