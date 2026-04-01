import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingBag, AlertCircle, CreditCard } from 'lucide-react';
import { useDailyMenu } from '@/hooks/useDailyMenu';
import { useTableOrders, useTableOrderMutations, OrderLine } from '@/hooks/useTableOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useProducts } from '@/hooks/useInventoryData';
import { MenuSelector } from './MenuSelector';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillView } from '@/components/restaurant/BillView';
import { PaymentSheet } from '@/components/restaurant/PaymentSheet';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tableId: string;
  tableLabel: string;
}

export function OrderSheet({ open, onOpenChange, tableId, tableLabel }: Props) {
  const { data: menu, isLoading: menuLoading } = useDailyMenu();
  const { data: orders = [] } = useTableOrders();
  const { openOrder, submitOrder } = useTableOrderMutations();
  const { data: catalogItems = [] } = useMenuItems();
  const { products } = useProducts();

  // Build stockMap: item_id → available (quantity - reserved_quantity)
  // Only includes items that have a linked product_id
  const stockMap: Record<string, number> = {};
  for (const catalogItem of catalogItems) {
    if (catalogItem.product_id) {
      const product = products.find((p) => p.id === catalogItem.product_id);
      if (product) {
        stockMap[catalogItem.id] = (product.quantity ?? 0) - ((product as any).reserved_quantity ?? 0);
      }
    }
  }

  const [pendingLines, setPendingLines] = useState<Omit<OrderLine, 'id' | 'status'>[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Existing open order for this table today
  const existingOrder = orders.find((o) => o.table_id === tableId && o.status === 'open');
  // Show Bill tab if there is any non-void order (open OR submitted)
  const hasExistingOrder = orders.some(o => o.table_id === tableId && o.status !== 'void');

  const totalItems = pendingLines.reduce((s, l) => s + l.quantity, 0);
  const totalPrice = pendingLines.reduce((s, l) => s + l.unit_price * l.quantity, 0);

  async function handleSubmit() {
    if (pendingLines.length === 0) {
      toast.error('Add at least one item before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      let orderId = existingOrder?.id;
      if (!orderId) {
        const result = await openOrder.mutateAsync({ tableId, tableLabel });
        orderId = result.id;
      }
      await submitOrder.mutateAsync({ orderId, lines: pendingLines as OrderLine[] });
      setPendingLines([]);
      onOpenChange(false);
    } catch {
      // Error toast handled by mutation
    } finally {
      setSubmitting(false);
    }
  }

  const menuNotPublished = menu && !menu.published_at;
  const noMenu = !menuLoading && !menu;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {tableLabel}
          </SheetTitle>
          <SheetDescription>Table ordering and payment</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue={hasExistingOrder ? 'bill' : 'order'} className="flex-1 flex flex-col min-h-0 mt-4">
          <TabsList className="flex-shrink-0 w-full">
            <TabsTrigger value="order" className="flex-1">New Order</TabsTrigger>
            {hasExistingOrder && <TabsTrigger value="bill" className="flex-1">Bill & Pay</TabsTrigger>}
          </TabsList>

          <TabsContent value="order" className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {menuLoading && (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {noMenu && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No menu has been set for today. Ask the kitchen to publish today's menu first.
                  </p>
                </div>
              )}

              {menuNotPublished && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm">
                  <p className="font-medium text-amber-700">Menu not published yet</p>
                  <p className="text-amber-600 text-xs mt-0.5">The kitchen has drafted a menu but hasn't published it. Orders cannot be taken yet.</p>
                </div>
              )}

              {menu && menu.published_at && (
                <MenuSelector
                  starters={menu.starters ?? []}
                  mains={menu.mains ?? []}
                  desserts={menu.desserts ?? []}
                  stockMap={stockMap}
                  onChange={setPendingLines}
                />
              )}

              {existingOrder && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm">
                  <p className="font-medium text-primary">Open order exists</p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Items above will be added to the existing open order for this table.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-border pt-4 space-y-3">
              {totalItems > 0 && (
                <div className="flex justify-between text-sm font-medium px-1">
                  <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                  <span>{new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(totalPrice)}</span>
                </div>
              )}
              <Button
                className="w-full"
                disabled={totalItems === 0 || submitting || !!menuNotPublished || noMenu}
                onClick={handleSubmit}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {submitting ? 'Sending to kitchen…' : `Send to Kitchen${totalItems > 0 ? ` (${totalItems})` : ''}`}
              </Button>
            </div>
          </TabsContent>

          {hasExistingOrder && (
            <TabsContent value="bill" className="flex-1 overflow-y-auto mt-2">
              <BillViewWithPay tableId={tableId} tableLabel={tableLabel} />
            </TabsContent>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function BillViewWithPay({ tableId, tableLabel }: { tableId: string; tableLabel: string }) {
  const [payOpen, setPayOpen] = useState(false);
  return (
    <div className="space-y-4 pb-4">
      <BillView tableId={tableId} tableLabel={tableLabel} />
      <Button className="w-full" onClick={() => setPayOpen(true)}>
        <CreditCard className="h-4 w-4 mr-2" />
        Pay
      </Button>
      <PaymentSheet open={payOpen} onOpenChange={setPayOpen} tableId={tableId} tableLabel={tableLabel} />
    </div>
  );
}
