import { useState, useEffect } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { type NewOrderPayload } from '@/hooks/usePurchaseOrders';
import { type LowStockAlert } from '@/hooks/useInventoryData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface OrderItemRow {
  key: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: NewOrderPayload) => void;
  isSubmitting?: boolean;
  prefillItems?: LowStockAlert[];
}

export default function NewOrderDialog({ open, onOpenChange, onSubmit, isSubmitting, prefillItems }: Props) {
  const { activeHotelId } = useAuth();
  const [vendorId, setVendorId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItemRow[]>([]);

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('hotel_id', activeHotelId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId && open,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products_active', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('hotel_id', activeHotelId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId && open,
  });

  // Pre-fill from low stock suggestions
  useEffect(() => {
    if (open && prefillItems && prefillItems.length > 0) {
      setItems(
        prefillItems.map((alert) => ({
          key: `${alert.product.id}-${Date.now()}`,
          product_id: alert.product.id,
          product_name: alert.product.name,
          quantity: alert.suggestedOrder,
          unit_cost: '',
        }))
      );
    }
  }, [open, prefillItems]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setVendorId('');
      setNotes('');
      setItems([]);
    }
  }, [open]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { key: `new-${Date.now()}`, product_id: '', product_name: '', quantity: 1, unit_cost: '' },
    ]);
  };

  const removeItem = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));

  const updateItem = (key: string, field: keyof OrderItemRow, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        if (field === 'product_id') {
          const product = products.find((p) => p.id === value);
          return { ...item, product_id: value as string, product_name: product?.name ?? '' };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const canSubmit =
    items.length > 0 && items.every((i) => i.product_id && i.quantity > 0) && !isSubmitting;

  const handleSubmit = () => {
    const selectedVendor = vendors.find((v) => v.id === vendorId);
    onSubmit({
      vendor_ref_id: vendorId || null,
      vendor_name: selectedVendor?.name ?? null,
      notes: notes.trim() || null,
      items: items.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: Number(i.quantity),
        unit_cost: i.unit_cost ? Number(i.unit_cost) : null,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Purchase Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Vendor */}
          <div>
            <Label>Vendor (optional)</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select vendor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No vendor</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No items yet. Add items to this order.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.key} className="grid grid-cols-[1fr_80px_90px_36px] gap-2 items-end">
                    <div>
                      <Label className="text-xs text-muted-foreground">Product</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(val) => updateItem(item.key, 'product_id', val)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select product..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        className="mt-1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.key, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Unit Cost</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="mt-1"
                        placeholder="0.00"
                        value={item.unit_cost}
                        onChange={(e) => updateItem(item.key, 'unit_cost', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive mt-5"
                      onClick={() => removeItem(item.key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              className="mt-1.5 resize-none"
              rows={2}
              placeholder="Order notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
