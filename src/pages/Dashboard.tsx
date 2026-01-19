import { useNavigate } from 'react-router-dom';
import { Play, Plus, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { LowStockCard } from '@/components/dashboard/LowStockCard';
import { POSStatusCard } from '@/components/dashboard/POSStatusCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { CategoryOverview } from '@/components/dashboard/CategoryOverview';
import { 
  mockProducts, 
  getLowStockAlerts, 
  mockPOSSyncStatus, 
  mockRecentMovements,
  getStockByCategory 
} from '@/data/mockData';
import { BeverageCategory } from '@/types/inventory';

export default function Dashboard() {
  const navigate = useNavigate();
  const lowStockAlerts = getLowStockAlerts();
  const stockByCategory = getStockByCategory('loc-1');

  const handleCategoryClick = (category: BeverageCategory) => {
    navigate(`/inventory?category=${category}`);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your inventory overview.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Button 
          variant="default" 
          size="lg" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/inventory?mode=count')}
        >
          <Play className="h-5 w-5" />
          <span className="text-xs">Quick Count</span>
        </Button>
        <Button 
          variant="secondary" 
          size="lg" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/products?action=new')}
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs">Add Item</span>
        </Button>
        <Button 
          variant="secondary" 
          size="lg" 
          className="h-auto py-4 flex-col gap-2"
          onClick={() => navigate('/orders?action=receive')}
        >
          <Scan className="h-5 w-5" />
          <span className="text-xs">Receive</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <QuickStats 
          totalProducts={mockProducts.length}
          lowStockCount={lowStockAlerts.length}
          lastCountedDays={2}
          todayUsageValue={847}
        />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <LowStockCard 
            alerts={lowStockAlerts} 
            onViewAll={() => navigate('/inventory?filter=low')}
          />
          <CategoryOverview 
            data={stockByCategory}
            onCategoryClick={handleCategoryClick}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <POSStatusCard 
            status={mockPOSSyncStatus}
            onSync={() => console.log('Syncing...')}
          />
          <RecentActivity movements={mockRecentMovements} />
        </div>
      </div>
    </div>
  );
}
