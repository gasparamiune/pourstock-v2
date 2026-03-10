/**
 * Phase 5B: Full CRUD for reorder_rules.
 * Legacy source: stock_levels.reorder_threshold (stays source of truth)
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSettingsCrud } from '@/hooks/useSettingsCrud';
import { RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RuleForm {
  product_id: string;
  min_threshold: number;
  reorder_quantity: number;
  auto_order: boolean;
}

const emptyForm: RuleForm = { product_id: '', min_threshold: 0, reorder_quantity: 0, auto_order: false };

export default function ReorderRuleSettings() {
  const { activeHotelId } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyForm);

  const { data: rules, isLoading } = useQuery({
    queryKey: ['reorder-rules', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reorder_rules')
        .select('*, product:products(name)')
        .eq('hotel_id', activeHotelId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId,
  });

  const { data: products } = useQuery({
    queryKey: ['products-list', activeHotelId],
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
    enabled: !!activeHotelId,
  });

  const { create, update, remove } = useSettingsCrud({
    table: 'reorder_rules',
    queryKey: 'reorder-rules',
    hotelId: activeHotelId,
    label: 'Reorder Rule',
  });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({ product_id: r.product_id, min_threshold: r.min_threshold, reorder_quantity: r.reorder_quantity, auto_order: r.auto_order });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.product_id) return;
    if (editingId) {
      update.mutate({ id: editingId, ...form }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(form, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deletingId) remove.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
  };

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Reorder Rules</h2>
        <Button size="sm" className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add Rule</Button>
      </div>

      {(!rules || rules.length === 0) ? (
        <div className="text-center py-8">
          <RefreshCw className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No reorder rules configured yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Reorder thresholds are currently managed per stock level.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center"><RefreshCw className="h-5 w-5 text-foreground" /></div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{(r as any).product?.name ?? 'Unknown product'}</h4>
                <p className="text-xs text-muted-foreground">Min: {r.min_threshold} · Reorder qty: {r.reorder_quantity}</p>
              </div>
              <Badge variant={r.auto_order ? 'default' : 'secondary'}>{r.auto_order ? 'Auto' : 'Manual'}</Badge>
              <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingId(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Reorder Rule' : 'Add Reorder Rule'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Product *</Label>
              <Select value={form.product_id} onValueChange={v => setForm(f => ({ ...f, product_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {(products ?? []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Min Threshold</Label><Input type="number" min={0} value={form.min_threshold} onChange={e => setForm(f => ({ ...f, min_threshold: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label>Reorder Quantity</Label><Input type="number" min={0} value={form.reorder_quantity} onChange={e => setForm(f => ({ ...f, reorder_quantity: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.auto_order} onCheckedChange={v => setForm(f => ({ ...f, auto_order: v }))} />
              <Label>Auto-order when below threshold</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.product_id || create.isPending || update.isPending}>{editingId ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={o => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Reorder Rule?</AlertDialogTitle><AlertDialogDescription>This rule will be deactivated. Stock level thresholds are unaffected.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
