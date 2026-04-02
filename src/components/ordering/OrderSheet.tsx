import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingBag, AlertCircle, CreditCard } from 'lucide-react';
import { useDailyMenu, DailyMenuItem } from '@/hooks/useDailyMenu';
import { useTableOrders, useTableOrderMutations, OrderLine } from '@/hooks/useTableOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
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
  const { data: catalogItems = [], isLoading: catalogLoading } = useMenuItems();

  // Build stock map from permanent catalog items (available_units - reserved_units)
  const stockMap: Record<string, number> = {};
  for (const item of catalogItems) {
    if (item.available_units != null) {
      stockMap[item.id] = Math.max(0, (item.available_units ?? 0) - (item.reserved_units ?? 0));
    }
  }

  // Convert catalog items to DailyMenuItem format for merging
  const permanentStarters: DailyMenuItem[] = catalogItems
    .filter(i => i.is_active && i.course === 'starter')
    .map(i => ({
      id: i.id,
      name: i.name,
      description: i.description ?? '',
      allergens: i.allergens ?? '',
      price: i.price,
      available_units: i.available_units != null
        ? Math.max(0, (i.available_units ?? 0) - (i.reserved_units ?? 0))
        : null,
    }));
  const permanentMains: DailyMenuItem[] = catalogItems
    .filter(i => i.is_active && i.course === 'main')
    .map(i => ({
      id: i.id,
      name: i.name,
      description: i.description ?? '',
      allergens: i.allergens ?? '',
      price: i.price,
      available_units: i.available_units != null
        ? Math.max(0, (i.available_units ?? 0) - (i.reserved_units ?? 0))
        : null,
    }));
  const permanentDesserts: DailyMenuItem[] = catalogItems
    .filter(i => i.is_active && i.course === 'dessert')
    .map(i => ({
      id: i.id,
      name: i.name,
      description: i.description ?? '',
      allergens: i.allergens ?? '',
      price: i.price,
      available_units: i.available_units != null
        ? Math.max(0, (i.available_units ?? 0) - (i.reserved_units ?? 0))
        : null,
    }));

  // Merge: daily menu items + permanent à la carte (deduplicated by id)
  const dailyStarters = menu?.starters ?? [];
  const dailyMains = menu?.mains ?? [];
  const dailyDesserts = menu?.desserts ?? [];

  const mergeItems = (daily: DailyMenuItem[], permanent: DailyMenuItem[]): DailyMenuItem[] => {
    const ids = new Set(daily.map(i => i.id));
    return [...daily, ...permanent.filter(p => !ids.has(p.id))];
  };

  const allStarters = mergeItems(dailyStarters, permanentStarters);
  const allMains = mergeItems(dailyMains, permanentMains);
  const allDesserts = mergeItems(dailyDesserts, permanentDesserts);

  const [pendingLines, setPendingLines] = useState<Omit<OrderLine, 'id' | 'status'>[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const existingOrder = orders.find((o) => o.table_id === tableId && o.status === 'open');
  const hasExistingOrder = orders.some(o => o.table_id === tableId && o.status !== 'void');

  const totalItems = pendingLines.reduce((s, l) => s + l.quantity, 0);
  const totalPrice = pendingLines.reduce((s, l) => s + l.unit_price * l.quantity, 0);

  const isLoading = menuLoading || catalogLoading;
  // Can order if we have any items (daily published OR permanent à la carte)
  const hasAnyItems = allStarters.length + allMains.length + allDesserts.length > 0;
  const menuNotPublished = menu && !menu.published_at && permanentStarters.length + permanentMains.length + permanentDesserts.length === 0;

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
              {isLoading && (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {!isLoading && !hasAnyItems && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No menu items available. Ask the kitchen to publish today's menu.
                  </p>
                </div>
              )}

              {menuNotPublished && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm">
                  <p className="font-medium text-amber-700">Daily menu not published yet</p>
                  <p className="text-amber-600 text-xs mt-0.5">The kitchen has drafted a menu but hasn't published it.</p>
                </div>
              )}

              {hasAnyItems && (
                <>
                  {/* Show daily menu section if published */}
                  {menu?.published_at && (dailyStarters.length > 0 || dailyMains.length > 0 || dailyDesserts.length > 0) && (
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs mb-2">Today's Menu</Badge>
                      <MenuSelector
                        starters={dailyStarters}
                        mains={dailyMains}
                        desserts={dailyDesserts}
                        stockMap={stockMap}
                        onChange={() => {}} // Handled via combined below
                      />
                    </div>
                  )}

                  {/* Combined selector for ordering */}
                  <MenuSelector
                    starters={allStarters}
                    mains={allMains}
                    desserts={allDesserts}
                    stockMap={stockMap}
                    onChange={setPendingLines}
                    showAlaCarteLabel={permanentStarters.length + permanentMains.length + permanentDesserts.length > 0}
                  />
                </>
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
                disabled={totalItems === 0 || submitting || !hasAnyItems}
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
