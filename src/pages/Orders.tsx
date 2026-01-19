import { useState } from 'react';
import { Plus, Package, ArrowDownToLine, Clock, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLowStockAlerts } from '@/data/mockData';
import { cn } from '@/lib/utils';

type TabType = 'suggested' | 'orders' | 'history';

export default function Orders() {
  const [activeTab, setActiveTab] = useState<TabType>('suggested');
  const lowStockAlerts = getLowStockAlerts();

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'suggested', label: 'Suggested', icon: Package },
    { id: 'orders', label: 'Orders', icon: FileText },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">Orders</h1>
          <p className="text-muted-foreground">Reorder suggestions & purchase orders</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Order
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
              {tab.label}
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
                <h2 className="font-display font-semibold text-lg">Suggested Orders</h2>
              </div>
              <Button variant="outline" size="sm">
                Create Order from Suggestions
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
                        {alert.location.name} • Current: {alert.currentStock} / Par: {alert.parLevel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-display font-bold text-primary">
                        +{alert.suggestedOrder}
                      </p>
                      <p className="text-xs text-muted-foreground">suggested</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success" />
                <p>All items are well stocked!</p>
                <p className="text-sm">No reorder suggestions at this time.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No active orders</p>
          <Button variant="link" className="mt-2">Create your first order</Button>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No order history yet</p>
          <p className="text-sm">Completed orders will appear here</p>
        </div>
      )}
    </div>
  );
}
