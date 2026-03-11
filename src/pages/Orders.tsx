import { useState } from 'react';
import { Plus, Package, ArrowDownToLine, Clock, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardData } from '@/hooks/useInventoryData';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type TabType = 'suggested' | 'orders' | 'history';

export default function Orders() {
  const [activeTab, setActiveTab] = useState<TabType>('suggested');
  const { t } = useLanguage();
  const { lowStockAlerts } = useDashboardData();

  const tabs: { id: TabType; labelKey: string; icon: React.ElementType }[] = [
    { id: 'suggested', labelKey: 'orders.suggested', icon: Package },
    { id: 'orders', labelKey: 'orders.orders', icon: FileText },
    { id: 'history', labelKey: 'orders.history', icon: Clock },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">{t('orders.title')}</h1>
          <p className="text-muted-foreground">{t('orders.description')}</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('orders.newOrder')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all touch-target",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'suggested' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5 text-primary" />
                <h2 className="font-display font-semibold text-lg">{t('orders.suggestedOrders')}</h2>
              </div>
              <Button variant="outline" size="sm">
                {t('orders.createFromSuggestions')}
              </Button>
            </div>
            
            {lowStockAlerts.length > 0 ? (
              <div className="space-y-3">
                {lowStockAlerts.map((alert) => (
                  <div 
                    key={`${alert.product.id}-${alert.location.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                  >
                    <div>
                      <h3 className="font-medium">{alert.product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {alert.location.name} • {t('orders.current')}: {alert.currentStock} / {t('orders.par')}: {alert.parLevel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-display font-bold text-primary">
                        +{alert.suggestedOrder}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('orders.suggested_lowercase')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success" />
                <p>{t('orders.allStocked')}</p>
                <p className="text-sm">{t('orders.noSuggestions')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{t('orders.noActiveOrders')}</p>
          <Button variant="link" className="mt-2">{t('orders.createFirst')}</Button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{t('orders.noHistory')}</p>
          <p className="text-sm">{t('orders.completedOrders')}</p>
        </div>
      )}
    </div>
  );
}
