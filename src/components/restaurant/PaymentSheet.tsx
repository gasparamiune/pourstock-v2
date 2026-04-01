import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, CheckCircle, AlertCircle, SplitSquareHorizontal } from 'lucide-react';
import { BillView } from './BillView';
import { SplitBillDialog } from './SplitBillDialog';
import { useTableOrders, useTableOrderMutations } from '@/hooks/useTableOrders';
import { useStripeTerminal, useOrderPayments } from '@/hooks/usePayments';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tableId: string;
  tableLabel: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

export function PaymentSheet({ open, onOpenChange, tableId, tableLabel }: Props) {
  const { data: orders = [] } = useTableOrders();
  const tableOrder = orders.find(o => o.table_id === tableId && o.status !== 'void');
  const { data: payments = [] } = useOrderPayments(tableOrder?.id ?? '');
  const { status, error, hotel, collectAndPay, reset } = useStripeTerminal();
  const { completeOrder } = useTableOrderMutations();
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [currentSplit, setCurrentSplit] = useState<{ index: number; total: number } | null>(null);

  if (!tableOrder) return null;

  const lines = tableOrder.lines ?? [];
  const totalAmount = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const paidAmount = payments.filter(p => p.status === 'succeeded').reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, totalAmount - paidAmount);
  const isFullyPaid = remaining <= 0;

  const successfulPayments = payments.filter(p => p.status === 'succeeded');
  const nextSplitIndex = currentSplit ? successfulPayments.filter(p => p.split_total === currentSplit.total).length + 1 : null;
  const splitComplete = currentSplit && nextSplitIndex !== null && nextSplitIndex > currentSplit.total;

  async function handlePay(splits: number) {
    if (!tableOrder) return;
    const splitTotal = splits > 1 ? splits : null;
    const splitIndex = splits > 1 ? (successfulPayments.filter(p => p.split_total === splits).length + 1) : null;

    if (splits > 1) setCurrentSplit({ index: splitIndex!, total: splits });

    const amountDkk = splits > 1 ? Math.round((remaining / splits) * 100) / 100 : remaining;

    await collectAndPay({
      orderId: tableOrder.id,
      amountDkk,
      splitIndex,
      splitTotal,
    });

    // Auto-complete when this payment covers the full remaining balance
    if (amountDkk >= remaining - 0.01) {
      await completeOrder.mutateAsync({ orderId: tableOrder.id });
    }
  }

  const isTerminalConnected = hotel?.stripe_connect_completed;
  const isProcessing = ['connecting', 'creating_intent', 'waiting_for_card', 'processing'].includes(status);

  return (
    <>
      <Sheet open={open} onOpenChange={v => { if (!isProcessing) { onOpenChange(v); reset(); } }}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Bill — {tableLabel}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <BillView tableId={tableId} tableLabel={tableLabel} />
          </div>

          <div className="flex-shrink-0 border-t border-border pt-4 space-y-3">
            {!isTerminalConnected && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                Stripe not connected. Configure in Settings → Restaurant.
              </div>
            )}

            {isFullyPaid || splitComplete ? (
              <div className="flex items-center justify-center gap-2 py-4 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <span className="font-semibold">Fully paid!</span>
              </div>
            ) : status === 'waiting_for_card' ? (
              <div className="text-center py-4 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm font-medium">Waiting for card…</p>
                <p className="text-xs text-muted-foreground">Present card to the reader</p>
              </div>
            ) : status === 'processing' ? (
              <div className="text-center py-4 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm font-medium">Processing payment…</p>
              </div>
            ) : status === 'succeeded' && currentSplit && nextSplitIndex !== null && nextSplitIndex <= currentSplit.total ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Split {nextSplitIndex - 1}/{currentSplit.total} paid
                  </span>
                </div>
                <Button className="w-full" onClick={() => { reset(); handlePay(currentSplit.total); }}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Next person ({fmt(remaining / (currentSplit.total - (nextSplitIndex - 1)))})
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}
                <Button
                  className="w-full"
                  disabled={!isTerminalConnected || isProcessing || remaining <= 0}
                  onClick={() => handlePay(1)}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  Charge {fmt(remaining)}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!isTerminalConnected || isProcessing || remaining <= 0}
                  onClick={() => setSplitDialogOpen(true)}
                >
                  <SplitSquareHorizontal className="h-4 w-4 mr-2" />
                  Split bill
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <SplitBillDialog
        open={splitDialogOpen}
        onOpenChange={setSplitDialogOpen}
        totalAmount={remaining}
        onConfirm={splits => handlePay(splits)}
      />
    </>
  );
}
