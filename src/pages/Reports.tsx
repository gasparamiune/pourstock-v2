import { useState } from 'react';
import { BarChart3, TrendingDown, AlertTriangle, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ReportType = 'variance' | 'usage' | 'cost' | 'waste';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('variance');
  const [dateRange, setDateRange] = useState('7d');

  const reports: { id: ReportType; label: string; icon: React.ElementType; description: string }[] = [
    { id: 'variance', label: 'Variance', icon: AlertTriangle, description: 'POS vs actual inventory' },
    { id: 'usage', label: 'Usage', icon: TrendingDown, description: 'Consumption trends' },
    { id: 'cost', label: 'Cost', icon: DollarSign, description: 'COGS analysis' },
    { id: 'waste', label: 'Waste', icon: AlertTriangle, description: 'Breakage & wastage' },
  ];

  const dateRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">Reports</h1>
          <p className="text-muted-foreground">Analytics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex bg-secondary rounded-lg p-1">
            {dateRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={cn(
                  "px-3 py-1 rounded-md text-sm transition-colors",
                  dateRange === range.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={cn(
                "glass-card rounded-2xl p-4 text-left transition-all touch-target",
                activeReport === report.id
                  ? "ring-2 ring-primary"
                  : "hover:bg-card/80"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                activeReport === report.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-medium">{report.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="glass-card rounded-2xl p-6">
        {activeReport === 'variance' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h2 className="font-display font-semibold text-lg">Variance Report</h2>
            </div>
            
            <div className="space-y-4">
              {/* Sample variance items */}
              <div className="grid gap-4">
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Grey Goose Vodka</h3>
                      <p className="text-sm text-muted-foreground">Main Bar</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-warning">-2.5 bottles</p>
                      <p className="text-xs text-muted-foreground">vs POS sales</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    AI insight: Unusual variance compared to last 4 weeks average of 0.3 bottles
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Hendrick's Gin</h3>
                      <p className="text-sm text-muted-foreground">Main Bar</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">-0.3 bottles</p>
                      <p className="text-xs text-muted-foreground">vs POS sales</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Don Julio Blanco</h3>
                      <p className="text-sm text-muted-foreground">Main Bar</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">+0.1 bottles</p>
                      <p className="text-xs text-muted-foreground">vs POS sales</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeReport === 'usage' && (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Usage trends chart</p>
            <p className="text-sm">Connect to Cloud for full analytics</p>
          </div>
        )}

        {activeReport === 'cost' && (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Cost analysis</p>
            <p className="text-sm">Connect to Cloud for full analytics</p>
          </div>
        )}

        {activeReport === 'waste' && (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Waste & breakage log</p>
            <p className="text-sm">No waste recorded in this period</p>
          </div>
        )}
      </div>
    </div>
  );
}
