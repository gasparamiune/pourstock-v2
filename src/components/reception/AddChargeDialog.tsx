import { useState } from 'react';
import { useChargeMutations } from '@/hooks/useReception';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CHARGE_TYPES = [
  { value: 'room_rate', label: 'Room Rate' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bar', label: 'Bar' },
  { value: 'minibar', label: 'Mini-Bar' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'parking', label: 'Parking' },
  { value: 'spa', label: 'Spa / Wellness' },
  { value: 'phone', label: 'Phone' },
  { value: 'damage', label: 'Damage' },
  { value: 'other', label: 'Other' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
}

export function AddChargeDialog({ open, onOpenChange, reservationId }: Props) {
  const { addCharge } = useChargeMutations();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [chargeType, setChargeType] = useState('other');

  function reset() {
    setDescription('');
    setAmount('');
    setChargeType('other');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0) {
      toast.error('Please enter a description and valid amount.');
      return;
    }

    addCharge.mutate(
      { reservation_id: reservationId, description: description.trim(), amount: amt, charge_type: chargeType },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Charge</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={chargeType} onValueChange={setChargeType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHARGE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              placeholder="e.g. Dinner for 2 — 24 Mar"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Amount (DKK)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addCharge.isPending}>
              {addCharge.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Add Charge
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
