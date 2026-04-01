import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Pencil, ChefHat, Package } from 'lucide-react';
import { useMenuItems, useMenuItemMutations, MenuItem, MenuCourse, MenuItemInput } from '@/hooks/useMenuItems';
import { useProducts } from '@/hooks/useInventoryData';

const COURSES: { value: MenuCourse; label: string }[] = [
  { value: 'starter', label: 'Starter' },
  { value: 'main', label: 'Main' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'drinks', label: 'Drinks' },
];

function emptyForm(): MenuItemInput {
  return { name: '', description: null, allergens: null, price: 0, course: 'main', is_active: true, sort_order: 0, product_id: null };
}

export function MenuCatalog() {
  const { data: items = [], isLoading } = useMenuItems();
  const { create, update, remove } = useMenuItemMutations();
  const { products } = useProducts();
  const [form, setForm] = useState<MenuItemInput>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const grouped = COURSES.map(c => ({
    ...c,
    items: items.filter(i => i.course === c.value),
  }));

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({ name: item.name, description: item.description, allergens: item.allergens, price: item.price, course: item.course, is_active: item.is_active, sort_order: item.sort_order, product_id: item.product_id });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, ...form });
        setEditingId(null);
      } else {
        await create.mutateAsync(form);
      }
      setForm(emptyForm());
    } finally {
      setSaving(false);
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

  function StockBadge({ productId }: { productId: string }) {
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    const available = ((product as any).quantity ?? 0) - ((product as any).reserved_quantity ?? 0);
    if (available <= 0) {
      return <Badge variant="destructive" className="text-xs">Sold out</Badge>;
    }
    if (available <= 3) {
      return <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">{available} left</Badge>;
    }
    return <Badge variant="outline" className="text-xs text-green-600 border-green-400">{available} avail.</Badge>;
  }

  return (
    <div className="space-y-6">
      {/* Add / Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ChefHat className="h-4 w-4" />
            {editingId ? 'Edit Item' : 'Add Menu Item'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Beef Tenderloin" />
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={form.course} onValueChange={v => setForm(f => ({ ...f, course: v as MenuCourse }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COURSES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Price (DKK)</Label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Allergens</Label>
              <Input value={form.allergens ?? ''} onChange={e => setForm(f => ({ ...f, allergens: e.target.value || null }))} placeholder="e.g. gluten, dairy" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Input value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))} placeholder="Short description for the order screen" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                Link to inventory product
                <span className="text-xs text-muted-foreground font-normal">(optional — enables stock tracking)</span>
              </Label>
              <Select
                value={form.product_id ?? 'none'}
                onValueChange={v => setForm(f => ({ ...f, product_id: v === 'none' ? null : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not linked to inventory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked to inventory</SelectItem>
                  {products.map(p => {
                    const available = ((p as any).quantity ?? 0) - ((p as any).reserved_quantity ?? 0);
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {available <= 0 ? ' — sold out' : available <= 3 ? ` — ${available} left` : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!form.name.trim() || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editingId ? 'Save Changes' : 'Add Item'}
            </Button>
            {editingId && <Button variant="outline" onClick={cancelEdit}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      {/* Grouped item list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        grouped.map(group => (
          group.items.length > 0 && (
            <div key={group.value} className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h3>
              {group.items.map(item => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={v => update.mutate({ id: item.id, is_active: v })}
                    />
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${!item.is_active ? 'line-through text-muted-foreground' : ''}`}>{item.name}</p>
                      {item.allergens && <p className="text-xs text-muted-foreground truncate">{item.allergens}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <Badge variant="secondary">{fmt(item.price)}</Badge>
                    {item.product_id && <StockBadge productId={item.product_id} />}
                    <button onClick={() => startEdit(item)} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove.mutate(item.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ))
      )}
    </div>
  );
}
