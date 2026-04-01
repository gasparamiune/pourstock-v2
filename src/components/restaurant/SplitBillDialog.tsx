import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  totalAmount: number;
  onConfirm: (splits: number) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

export function SplitBillDialog({ open, onOpenChange, totalAmount, onConfirm }: Props) {
  const [splits, setSplits] = useState(2);
  const perPerson = totalAmount / splits;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Split Bill</DialogTitle>
          <DialogDescription>
            Total: <strong>{fmt(totalAmount)}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" size="icon" onClick={() => setSplits(s => Math.max(2, s - 1))} disabled={splits <= 2}>−</Button>
            <div className="text-center">
              <p className="text-2xl font-bold">{splits}</p>
              <p className="text-xs text-muted-foreground">people</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => setSplits(s => Math.min(10, s + 1))}>+</Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {fmt(perPerson)} per person
          </p>
          <Button className="w-full" onClick={() => { onConfirm(splits); onOpenChange(false); }}>
            Split {splits} ways
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => { onConfirm(1); onOpenChange(false); }}>
            Pay full amount
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
