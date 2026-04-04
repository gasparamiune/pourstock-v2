import { useState } from 'react';
import { ChefHat, Eye, BookOpen, UtensilsCrossed } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KitchenDisplay } from '@/components/kitchen/KitchenDisplay';
import { DailyMenuEditor } from '@/components/kitchen/DailyMenuEditor';
import { WaiterDisplay } from '@/components/kitchen/WaiterDisplay';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export default function Kitchen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('kds');
  const [showEditor, setShowEditor] = useState(false);
  const today = new Date().toLocaleDateString('da-DK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ── Left: KDS / Waiter tabs ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-border/30 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              {t('kitchen.title')}
            </h1>
            <p className="text-xs text-muted-foreground capitalize">{today}</p>
          </div>
          <button
            onClick={() => setShowEditor(e => !e)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              showEditor
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted',
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            {t('kitchen.menuEditor')}
          </button>
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

      {/* ── Right: Menu Editor panel (toggleable) ── */}
      {showEditor && (
        <div className="w-[420px] shrink-0 border-l border-border/30 flex flex-col overflow-hidden bg-card/50">
          <div className="flex-1 overflow-auto p-3">
            <DailyMenuEditor />
          </div>
        </div>
      )}
    </div>
  );
}
