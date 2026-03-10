/**
 * Phase 5B: Full CRUD for restaurants + service_periods.
 * Future FK targets — delete uses soft-delete to prevent cascade issues.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSettingsCrud } from '@/hooks/useSettingsCrud';
import { UtensilsCrossed, Clock, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// ---------- Restaurant form ----------
interface RestForm { name: string; slug: string; description: string; capacity: number; }
const emptyRest: RestForm = { name: '', slug: '', description: '', capacity: 0 };

// ---------- Service Period form ----------
interface SPForm { name: string; slug: string; start_time: string; end_time: string; restaurant_id: string; }
const emptySP: SPForm = { name: '', slug: '', start_time: '18:00', end_time: '22:00', restaurant_id: '' };

export default function RestaurantSettings() {
  const { activeHotelId } = useAuth();

  // --- Restaurant state ---
  const [restDialog, setRestDialog] = useState(false);
  const [restEditId, setRestEditId] = useState<string | null>(null);
  const [restDeleteId, setRestDeleteId] = useState<string | null>(null);
  const [restForm, setRestForm] = useState<RestForm>(emptyRest);

  // --- Service Period state ---
  const [spDialog, setSpDialog] = useState(false);
  const [spEditId, setSpEditId] = useState<string | null>(null);
  const [spDeleteId, setSpDeleteId] = useState<string | null>(null);
  const [spForm, setSpForm] = useState<SPForm>(emptySP);

  const { data: restaurants, isLoading: loadingR } = useQuery({
    queryKey: ['restaurants', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase.from('restaurants').select('*').eq('hotel_id', activeHotelId).eq('is_active', true).order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId,
  });

  const { data: servicePeriods, isLoading: loadingSP } = useQuery({
    queryKey: ['service-periods', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_periods').select('*, restaurant:restaurants(name)').eq('hotel_id', activeHotelId).eq('is_active', true).order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId,
  });

  const restCrud = useSettingsCrud({ table: 'restaurants', queryKey: 'restaurants', hotelId: activeHotelId, label: 'Restaurant' });
  const spCrud = useSettingsCrud({ table: 'service_periods', queryKey: 'service-periods', hotelId: activeHotelId, label: 'Service Period' });

  // --- Restaurant handlers ---
  const openCreateRest = () => { setRestEditId(null); setRestForm(emptyRest); setRestDialog(true); };
  const openEditRest = (r: any) => { setRestEditId(r.id); setRestForm({ name: r.name, slug: r.slug, description: r.description ?? '', capacity: r.capacity }); setRestDialog(true); };
  const saveRest = () => {
    if (!restForm.name.trim()) return;
    const slug = restForm.slug || slugify(restForm.name);
    const payload = { name: restForm.name, slug, description: restForm.description || null, capacity: restForm.capacity };
    if (restEditId) restCrud.update.mutate({ id: restEditId, ...payload }, { onSuccess: () => setRestDialog(false) });
    else restCrud.create.mutate(payload, { onSuccess: () => setRestDialog(false) });
  };
  const deleteRest = () => { if (restDeleteId) restCrud.remove.mutate(restDeleteId, { onSuccess: () => setRestDeleteId(null) }); };

  // --- Service Period handlers ---
  const openCreateSP = () => { setSpEditId(null); setSpForm(emptySP); setSpDialog(true); };
  const openEditSP = (sp: any) => { setSpEditId(sp.id); setSpForm({ name: sp.name, slug: sp.slug, start_time: sp.start_time?.slice(0, 5) ?? '18:00', end_time: sp.end_time?.slice(0, 5) ?? '22:00', restaurant_id: sp.restaurant_id ?? '' }); setSpDialog(true); };
  const saveSP = () => {
    if (!spForm.name.trim()) return;
    const slug = spForm.slug || slugify(spForm.name);
    const payload = { name: spForm.name, slug, start_time: spForm.start_time, end_time: spForm.end_time, restaurant_id: spForm.restaurant_id || null };
    if (spEditId) spCrud.update.mutate({ id: spEditId, ...payload }, { onSuccess: () => setSpDialog(false) });
    else spCrud.create.mutate(payload, { onSuccess: () => setSpDialog(false) });
  };
  const deleteSP = () => { if (spDeleteId) spCrud.remove.mutate(spDeleteId, { onSuccess: () => setSpDeleteId(null) }); };

  if (loadingR || loadingSP) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <h2 className="font-display font-semibold text-lg">Restaurants & Service</h2>

      {/* Restaurants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Restaurants</h3>
          <Button size="sm" variant="outline" className="gap-2" onClick={openCreateRest}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        {(!restaurants || restaurants.length === 0) ? (
          <p className="text-sm text-muted-foreground">No restaurants configured.</p>
        ) : (
          <div className="space-y-2">
            {restaurants.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center"><UtensilsCrossed className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{r.name}</h4>
                  {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{r.capacity > 0 ? `${r.capacity} seats` : ''}</span>
                <Button variant="ghost" size="icon" onClick={() => openEditRest(r)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setRestDeleteId(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Periods */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Service Periods</h3>
          <Button size="sm" variant="outline" className="gap-2" onClick={openCreateSP}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        {(!servicePeriods || servicePeriods.length === 0) ? (
          <p className="text-sm text-muted-foreground">No service periods configured.</p>
        ) : (
          <div className="space-y-2">
            {servicePeriods.map((sp) => (
              <div key={sp.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-xl bg-accent/50 flex items-center justify-center"><Clock className="h-5 w-5 text-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{sp.name}</h4>
                  {(sp as any).restaurant?.name && <p className="text-xs text-muted-foreground">{(sp as any).restaurant.name}</p>}
                </div>
                <span className="text-sm font-medium text-muted-foreground">{sp.start_time?.slice(0, 5)} – {sp.end_time?.slice(0, 5)}</span>
                <Button variant="ghost" size="icon" onClick={() => openEditSP(sp)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setSpDeleteId(sp.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restaurant Dialog */}
      <Dialog open={restDialog} onOpenChange={setRestDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{restEditId ? 'Edit Restaurant' : 'Add Restaurant'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={restForm.name} onChange={e => setRestForm(f => ({ ...f, name: e.target.value, ...(restEditId ? {} : { slug: slugify(e.target.value) }) }))} /></div>
            <div><Label>Slug</Label><Input value={restForm.slug} onChange={e => setRestForm(f => ({ ...f, slug: e.target.value }))} /></div>
            <div><Label>Description</Label><Input value={restForm.description} onChange={e => setRestForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Capacity</Label><Input type="number" min={0} value={restForm.capacity} onChange={e => setRestForm(f => ({ ...f, capacity: parseInt(e.target.value) || 0 }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestDialog(false)}>Cancel</Button>
            <Button onClick={saveRest} disabled={!restForm.name.trim() || restCrud.create.isPending || restCrud.update.isPending}>{restEditId ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Period Dialog */}
      <Dialog open={spDialog} onOpenChange={setSpDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{spEditId ? 'Edit Service Period' : 'Add Service Period'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={spForm.name} onChange={e => setSpForm(f => ({ ...f, name: e.target.value, ...(spEditId ? {} : { slug: slugify(e.target.value) }) }))} /></div>
            <div><Label>Slug</Label><Input value={spForm.slug} onChange={e => setSpForm(f => ({ ...f, slug: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time</Label><Input type="time" value={spForm.start_time} onChange={e => setSpForm(f => ({ ...f, start_time: e.target.value }))} /></div>
              <div><Label>End Time</Label><Input type="time" value={spForm.end_time} onChange={e => setSpForm(f => ({ ...f, end_time: e.target.value }))} /></div>
            </div>
            {restaurants && restaurants.length > 0 && (
              <div>
                <Label>Restaurant (optional)</Label>
                <Select value={spForm.restaurant_id} onValueChange={v => setSpForm(f => ({ ...f, restaurant_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select restaurant" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {restaurants.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpDialog(false)}>Cancel</Button>
            <Button onClick={saveSP} disabled={!spForm.name.trim() || spCrud.create.isPending || spCrud.update.isPending}>{spEditId ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmations */}
      <AlertDialog open={!!restDeleteId} onOpenChange={o => !o && setRestDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Restaurant?</AlertDialogTitle><AlertDialogDescription>This restaurant will be deactivated. It may be referenced by service periods.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteRest}>Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!spDeleteId} onOpenChange={o => !o && setSpDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Service Period?</AlertDialogTitle><AlertDialogDescription>This service period will be deactivated.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteSP}>Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
