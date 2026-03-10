/**
 * Phase 5A: Full CRUD for room_types table.
 * Legacy source: rooms.room_type enum (stays source of truth for rooms)
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSettingsCrud } from '@/hooks/useSettingsCrud';
import { BedDouble, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface RoomTypeForm {
  name: string;
  slug: string;
  description: string;
  default_capacity: number;
  base_rate: string;
}

const emptyForm: RoomTypeForm = { name: '', slug: '', description: '', default_capacity: 2, base_rate: '' };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export default function RoomTypeSettings() {
  const { activeHotelId } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoomTypeForm>(emptyForm);

  const { data: roomTypes, isLoading } = useQuery({
    queryKey: ['room-types', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId,
  });

  const { create, update, remove } = useSettingsCrud({
    table: 'room_types',
    queryKey: 'room-types',
    hotelId: activeHotelId,
    label: 'Room Type',
  });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (rt: any) => {
    setEditingId(rt.id);
    setForm({ name: rt.name, slug: rt.slug, description: rt.description ?? '', default_capacity: rt.default_capacity, base_rate: rt.base_rate?.toString() ?? '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const slug = form.slug || slugify(form.name);
    const payload = {
      name: form.name,
      slug,
      description: form.description || null,
      default_capacity: form.default_capacity,
      base_rate: form.base_rate ? parseFloat(form.base_rate) : null,
    };
    if (editingId) {
      update.mutate({ id: editingId, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deletingId) remove.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
  };

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Room Types</h2>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Room Type
        </Button>
      </div>

      {(!roomTypes || roomTypes.length === 0) ? (
        <p className="text-sm text-muted-foreground">No room types configured.</p>
      ) : (
        <div className="space-y-2">
          {roomTypes.map((rt) => (
            <div key={rt.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <BedDouble className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{rt.name}</h4>
                {rt.description && <p className="text-xs text-muted-foreground">{rt.description}</p>}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <span>{rt.default_capacity} guests</span>
                {rt.base_rate && <p className="text-xs">{rt.base_rate} DKK/night</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(rt)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingId(rt.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Rooms currently use the legacy room_type enum. These entries prepare for future normalization.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Room Type' : 'Add Room Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, ...(editingId ? {} : { slug: slugify(e.target.value) }) }))} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Default Capacity</Label><Input type="number" min={1} value={form.default_capacity} onChange={e => setForm(f => ({ ...f, default_capacity: parseInt(e.target.value) || 1 }))} /></div>
              <div><Label>Base Rate (DKK)</Label><Input type="number" min={0} step="0.01" value={form.base_rate} onChange={e => setForm(f => ({ ...f, base_rate: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || create.isPending || update.isPending}>
              {editingId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Room Type?</AlertDialogTitle>
            <AlertDialogDescription>This room type will be deactivated. Rooms still use the legacy type enum.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
