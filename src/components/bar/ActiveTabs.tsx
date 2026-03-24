import { useState } from 'react';
import { useProducts } from '@/hooks/useInventoryData';
import { useReservations } from '@/hooks/useReception';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Wine, Plus, Receipt, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const BAR_CATEGORIES = ['wine', 'beer', 'spirits', 'coffee', 'soda', 'syrup'];

interface BarLine {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

interface BarTab {
  label: string;
  lines: BarLine[];
}

export function ActiveTabs() {
  const today = new Date().toISOString().split('T')[0];
  const { data: reservations = [] } = useReservations({ from: today, to: today });
  const { products } = useProducts();
  const { activeHotelId } = useAuth();

  const barProducts = products.filter((p) => BAR_CATEGORIES.includes(p.category ?? ''));

  const [tabs, setTabs] = useState<Record<string, BarTab>>({});
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [qty, setQty] = useState('1');

  const checkedIn = (reservations as any[]).filter((r) => r.status === 'checked_in');

  function addToTab() {
    if (!selectedRoom || !selectedProduct) return;
    const product = barProducts.find((p) => p.id === selectedProduct);
    if (!product) return;
    const q = Math.max(1, parseInt(qty, 10) || 1);

    setTabs((prev) => {
      const existing = prev[selectedRoom] ?? { label: selectedRoom, lines: [] };
      const existingLine = existing.lines.find((l) => l.productId === product.id);
      const lines = existingLine
        ? existing.lines.map((l) => l.productId === product.id ? { ...l, qty: l.qty + q } : l)
        : [...existing.lines, { productId: product.id, name: product.name, qty: q, unitPrice: product.par_level ?? 0 }];
      return { ...prev, [selectedRoom]: { ...existing, lines } };
    });
    setQty('1');
    toast.success(`Added ${q}× ${product.name} to ${selectedRoom}`);
  }

  async function postToFolio(roomLabel: string) {
    const tab = tabs[roomLabel];
    if (!tab || tab.lines.length === 0) return;
    const res = checkedIn.find((r: any) => {
      const room = r.room;
      return room && `Room ${room.room_number}` === roomLabel;
    });
    if (!res) {
      toast.error('No checked-in reservation found for this room.');
      return;
    }
    try {
      const charges = tab.lines.map((l) => ({
        hotel_id: activeHotelId,
        reservation_id: res.id,
        description: `Bar: ${l.name} ×${l.qty}`,
        amount: l.unitPrice * l.qty,
        charge_type: 'bar',
        charged_by: null,
      }));
      const { error } = await supabase.from('room_charges').insert(charges as any);
      if (error) throw error;
      setTabs((prev) => { const next = { ...prev }; delete next[roomLabel]; return next; });
      toast.success(`Tab for ${roomLabel} posted to folio.`);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const tabEntries = Object.entries(tabs);

  return (
    <div className="space-y-5">
      {/* Add item to tab */}
      <Card className="glass-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add to Tab
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-4 gap-3">
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger><SelectValue placeholder="Room / Table" /></SelectTrigger>
              <SelectContent>
                {checkedIn.map((r: any) => (
                  <SelectItem key={r.id} value={`Room ${r.room?.room_number ?? r.id}`}>
                    Room {r.room?.room_number} — {r.guest?.first_name} {r.guest?.last_name}
                  </SelectItem>
                ))}
                {['Bar 1', 'Bar 2', 'Bar 3', 'Terrace'].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
              <SelectContent>
                {barProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Qty"
            />

            <Button onClick={addToTab} disabled={!selectedRoom || !selectedProduct}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Open tabs */}
      {tabEntries.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground">
          <Wine className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No open tabs</p>
          <p className="text-sm mt-1">Add items above to start a tab.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {tabEntries.map(([label, tab]) => {
            const total = tab.lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
            return (
              <Card key={label} className="glass-card border-border/50">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                  <Badge variant="outline">{tab.lines.length} items</Badge>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {tab.lines.map((l) => (
                    <div key={l.productId} className="flex justify-between text-sm">
                      <span>{l.name} ×{l.qty}</span>
                      <span className="text-muted-foreground">DKK {(l.unitPrice * l.qty).toFixed(0)}</span>
                    </div>
                  ))}
                  <div className="border-t border-border/50 pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>DKK {total.toFixed(0)}</span>
                  </div>
                  <Button size="sm" className="w-full mt-2 gap-1.5" onClick={() => postToFolio(label)}>
                    <Receipt className="h-3.5 w-3.5" /> Post to Folio
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
