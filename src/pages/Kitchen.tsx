import { useState } from 'react';
import { ChefHat, Eye, BookOpen, LayoutGrid } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KitchenDisplay, useServiceCounters } from '@/components/kitchen/KitchenDisplay';
import { DailyMenuEditor } from '@/components/kitchen/DailyMenuEditor';
import { WaiterDisplay } from '@/components/kitchen/WaiterDisplay';
import { ServiceOverview } from '@/components/kitchen/ServiceOverview';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const COUNTER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  starter:   { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  mellemret: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  main:      { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  dessert:   { bg: 'bg-sky-400/10', text: 'text-sky-400', border: 'border-sky-400/30' },
};

const COUNTER_LABELS: Record<string, string> = {
  starter: 'Forret',
  mellemret: 'Mellemret',
  main: 'Hovedret',
  dessert: 'Dessert',
};

export default function Kitchen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('kds');
  const [showEditor, setShowEditor] = useState(false);
  const today = new Date().toLocaleDateString('da-DK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const counters = useServiceCounters();

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ── Left: KDS / Waiter tabs ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-border/30 flex items-center justify-between gap-3">
          {/* Left: title */}
          <div className="shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <ChefHat className="h-6 w-6 text-primary" />
              {t('kitchen.title')}
            </h1>
            <p className="text-xs text-muted-foreground capitalize">{today}</p>
          </div>

          {/* Center: KDS/Waiter tabs + Menu Editor */}
          <div className="flex items-center gap-2">
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

          {/* Right: Service Counters Block */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(['starter', 'mellemret', 'main', 'dessert'] as const).map(course => {
              const rem = counters.remaining[course] ?? 0;
              const exp = counters.expected[course] ?? 0;
              const colors = COUNTER_COLORS[course];
              return (
                <div
                  key={course}
                  className={cn(
                    'flex flex-col items-center px-2.5 py-1.5 rounded-lg border min-w-[60px]',
                    colors.bg, colors.border,
                  )}
                >
                  <span className={cn('text-xl font-black tabular-nums leading-none', colors.text)}>{rem}</span>
                  <span className="text-[8px] text-muted-foreground/60 leading-tight mt-0.5">
                    {rem === exp ? '' : 'missing / '}{exp} total
                  </span>
                  <span className={cn('text-[9px] font-semibold tracking-wide', colors.text)}>{COUNTER_LABELS[course]}</span>
                </div>
              );
            })}
          </div>
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
              <TabsTrigger value="overview" className="text-xs gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                Overblik
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="kds" className="flex-1 overflow-auto p-3 sm:p-4 mt-0">
            <KitchenDisplay />
          </TabsContent>

          <TabsContent value="waiter" className="flex-1 overflow-auto p-3 sm:p-4 mt-0">
            <WaiterDisplay />
          </TabsContent>

          <TabsContent value="overview" className="flex-1 overflow-auto mt-0">
            <ServiceOverview />
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
