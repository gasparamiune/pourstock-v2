import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Globe, CheckCircle, Package, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { VisualMenuBoard } from '@/components/ordering/VisualMenuBoard';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  name: string;
  description: string;
  allergens: string;
  price: number;
  available_units?: number | null;
}

interface DailyMenu {
  id: string;
  hotel_id: string;
  menu_date: string;
  starters: MenuItem[];
  mellemret: MenuItem[];
  mains: MenuItem[];
  desserts: MenuItem[];
  published_at: string | null;
  notes: string | null;
}

function emptyItem(): MenuItem {
  return { id: crypto.randomUUID(), name: '', description: '', allergens: '', price: 0, available_units: null };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useTodayMenu(date: string) {
  const { activeHotelId } = useAuth();
  return useQuery({
    queryKey: ['daily-menu', activeHotelId, date],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_menus' as any)
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('menu_date', date)
        .maybeSingle();
      return (data as unknown) as DailyMenu | null;
    },
    enabled: !!activeHotelId,
  });
}

function useMenuMutations(date: string) {
  const qc = useQueryClient();
  const { activeHotelId, user } = useAuth();

  const saveMenu = useMutation({
    mutationFn: async (menu: Partial<DailyMenu>) => {
      const payload = {
        hotel_id: activeHotelId,
        menu_date: date,
        starters: menu.starters ?? [],
        mellemret: menu.mellemret ?? [],
        mains: menu.mains ?? [],
        desserts: menu.desserts ?? [],
        notes: menu.notes ?? null,
        updated_at: new Date().toISOString(),
      };

      if (menu.id) {
        const { error } = await supabase.from('daily_menus' as any).update(payload).eq('id', menu.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('daily_menus' as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-menu'] });
      toast.success('Menu saved.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishMenu = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_menus' as any)
        .update({ published_at: new Date().toISOString(), published_by: user?.id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-menu'] });
      toast.success('Menu published! Waiters can now take orders.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { saveMenu, publishMenu };
}

// ── Menu section editor ───────────────────────────────────────────────────────

function CourseSection({ title, color, items, max, onChange }: {
  title: string;
  color: string;
  items: MenuItem[];
  max: number;
  onChange: (items: MenuItem[]) => void;
}) {
  function updateItem(index: number, field: keyof MenuItem, value: string | number | null) {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  }

  function addItem() {
    if (items.length >= max) return;
    onChange([...items, emptyItem()]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm flex items-center justify-between ${color}`}>
          <span>{title}</span>
          <Badge variant="outline" className="text-xs font-normal">{items.length}/{max}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, i) => (
          <div key={item.id} className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex gap-2">
              <Input
                placeholder="Dish name"
                value={item.name}
                onChange={(e) => updateItem(i, 'name', e.target.value)}
                className="flex-1"
              />
              <Button size="icon" variant="ghost" className="text-destructive flex-shrink-0" onClick={() => removeItem(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Description (optional)"
              value={item.description}
              onChange={(e) => updateItem(i, 'description', e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Allergens"
                value={item.allergens}
                onChange={(e) => updateItem(i, 'allergens', e.target.value)}
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">DKK</span>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  className="pl-12"
                  placeholder="0"
                  value={item.price || ''}
                  onChange={(e) => updateItem(i, 'price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="1"
                  className="pl-9"
                  placeholder="∞"
                  value={item.available_units ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateItem(i, 'available_units', v === '' ? null : parseInt(v) || 0);
                  }}
                  title="Available units (leave empty for unlimited)"
                />
              </div>
            </div>
          </div>
        ))}

        {items.length < max && (
          <Button size="sm" variant="outline" className="w-full" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Add {title.replace(/s$/, '').replace(/er$/, '')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── À la carte stock manager ──────────────────────────────────────────────────

function AlaCarteStockManager() {
  const { data: items = [], isLoading } = useMenuItems();
  const qc = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);

  async function setAvailableUnits(itemId: string, units: number | null) {
    setUpdating(itemId);
    const { error } = await supabase
      .from('menu_items' as any)
      .update({ available_units: units, updated_at: new Date().toISOString() })
      .eq('id', itemId);
    setUpdating(null);
    if (error) {
      toast.error(error.message);
    } else {
      qc.invalidateQueries({ queryKey: ['menu-items'] });
    }
  }

  const activeItems = items.filter(i => i.is_active);
  if (isLoading || activeItems.length === 0) return null;

  const courses = [
    { label: 'Forretter', course: 'starter', color: 'text-blue-600' },
    { label: 'Mellemretter', course: 'mellemret', color: 'text-amber-600' },
    { label: 'Hovedretter', course: 'main', color: 'text-primary' },
    { label: 'Desserter', course: 'dessert', color: 'text-pink-600' },
  ];

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="h-4 w-4" />
          À la Carte — Available Units
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {courses.map(({ label, course, color }) => {
          const courseItems = activeItems.filter(i => i.course === course);
          if (courseItems.length === 0) return null;
          return (
            <div key={course} className="space-y-2">
              <h4 className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</h4>
              {courseItems.map(item => {
                const available = item.available_units != null
                  ? Math.max(0, item.available_units - (item.reserved_units ?? 0))
                  : null;
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 p-2 rounded-lg border border-border/30 bg-card/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {available !== null && available <= 3 && available > 0 && (
                        <p className="text-xs text-amber-600">{available} remaining</p>
                      )}
                      {available !== null && available <= 0 && (
                        <p className="text-xs text-destructive font-medium">Sold out</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        className="w-20 h-8 text-center text-sm"
                        placeholder="∞"
                        value={item.available_units ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAvailableUnits(item.id, v === '' ? null : parseInt(v) || 0);
                        }}
                        disabled={updating === item.id}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {item.available_units != null ? `of ${item.available_units}` : 'unlimited'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Main DailyMenuEditor ──────────────────────────────────────────────────────

export function DailyMenuEditor() {
  const today = new Date().toISOString().split('T')[0];
  const { data: menu, isLoading } = useTodayMenu(today);
  const { saveMenu, publishMenu } = useMenuMutations(today);
  const { data: catalogItems = [] } = useMenuItems();

  const [starters, setStarters] = useState<MenuItem[]>([]);
  const [mellemret, setMellemret] = useState<MenuItem[]>([]);
  const [mains, setMains] = useState<MenuItem[]>([]);
  const [desserts, setDesserts] = useState<MenuItem[]>([]);
  const [notes, setNotes] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // Sync state when menu loads
  useEffect(() => {
    if (menu) {
      setStarters(menu.starters ?? []);
      setMellemret(menu.mellemret ?? []);
      setMains(menu.mains ?? []);
      setDesserts(menu.desserts ?? []);
      setNotes(menu.notes ?? '');
    }
  }, [menu]);

  function handleSave() {
    saveMenu.mutate({ id: menu?.id, starters, mellemret, mains, desserts, notes });
  }

  function handlePublish() {
    if (!menu?.id) { toast.error('Save the menu first before publishing.'); return; }
    publishMenu.mutate(menu.id);
  }

  function handleLoadFromCatalog() {
    // Give loaded items NEW UUIDs so they are independent daily-menu copies
    // and don't collide with the permanent à la carte catalog items
    const toDaily = (i: typeof catalogItems[number]) => ({
      id: crypto.randomUUID(),
      name: i.name,
      description: i.description ?? '',
      allergens: i.allergens ?? '',
      price: i.price,
      available_units: i.available_units,
    });

    const catalogStarters   = catalogItems.filter(i => i.is_active && i.course === 'starter').map(toDaily);
    const catalogMellemret  = catalogItems.filter(i => i.is_active && i.course === 'mellemret').map(toDaily);
    const catalogMains      = catalogItems.filter(i => i.is_active && i.course === 'main').map(toDaily);
    const catalogDesserts   = catalogItems.filter(i => i.is_active && (i.course === 'dessert' || i.course === 'drinks')).map(toDaily);

    // Deduplicate by name (case-insensitive) so re-loading doesn't duplicate
    const dedup = (prev: MenuItem[], incoming: typeof catalogStarters) => {
      const existingNames = new Set(prev.map(x => x.name.toLowerCase()));
      return [...prev, ...incoming.filter(x => !existingNames.has(x.name.toLowerCase()))];
    };

    setStarters(prev => dedup(prev, catalogStarters));
    setMains(prev => dedup(prev, catalogMains));
    setDesserts(prev => dedup(prev, catalogDesserts));
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isPublished = !!menu?.published_at;

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`rounded-xl px-4 py-3 flex items-center justify-between gap-3 ${
        isPublished
          ? 'bg-gradient-to-r from-green-500/20 to-transparent border-l-4 border-green-500 pl-4'
          : 'bg-muted/30 border border-border/40'
      }`}>
        <div className="flex items-center gap-2 text-sm">
          {isPublished ? (
            <>
              <CheckCircle className={`h-4 w-4 text-green-500 ${isPublished ? 'pulse-glow' : ''}`} />
              <span className="text-green-400 font-semibold">Live</span>
              <span className="text-muted-foreground">
                · Published at {format(new Date(menu!.published_at!), 'HH:mm')} · Menu is live for ordering
              </span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Draft — not yet visible to waiters</span>
            </>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(p => !p)}
            className="gap-1.5"
          >
            {previewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          {catalogItems.length > 0 && !previewMode && (
            <Button variant="outline" size="sm" onClick={handleLoadFromCatalog} type="button">
              Load from Catalog
            </Button>
          )}
          {!previewMode && (
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saveMenu.isPending}>
              {saveMenu.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Save
            </Button>
          )}
          {!isPublished && !previewMode && (
            <Button size="sm" onClick={handlePublish} disabled={publishMenu.isPending || starters.length + mains.length + desserts.length === 0}>
              Publish Menu
            </Button>
          )}
        </div>
      </div>

      {/* Preview mode: waiter view */}
      {previewMode ? (
        <div className="rounded-xl border border-border/40 overflow-hidden" style={{ height: '480px' }}>
          <div className="px-4 py-2 bg-muted/20 border-b border-border/40 text-xs text-muted-foreground font-medium">
            Waiter view preview
          </div>
          <VisualMenuBoard
            starters={starters.map(i => ({ id: i.id, name: i.name, description: i.description, allergens: i.allergens, price: i.price, available_units: i.available_units ?? null }))}
            mains={mains.map(i => ({ id: i.id, name: i.name, description: i.description, allergens: i.allergens, price: i.price, available_units: i.available_units ?? null }))}
            desserts={desserts.map(i => ({ id: i.id, name: i.name, description: i.description, allergens: i.allergens, price: i.price, available_units: i.available_units ?? null }))}
            stockMap={{}}
            selection={{}}
            onAdd={() => {}}
            onRemove={() => {}}
            onRequestNote={() => {}}
            readOnly
          />
        </div>
      ) : (
        /* Daily menu course editors */
        <div className="space-y-4">
          <CourseSection title="Forretter" color="text-green-600" items={starters} max={20} onChange={setStarters} />
          <CourseSection title="Hovedretter" color="text-red-600" items={mains} max={20} onChange={setMains} />
          <CourseSection title="Desserter" color="text-sky-400" items={desserts} max={20} onChange={setDesserts} />
        </div>
      )}

      {/* À la carte stock management */}
      <AlaCarteStockManager />

      {/* Kitchen notes */}
      <div className="space-y-1.5">
        <Label>Kitchen Notes (internal)</Label>
        <Input
          placeholder="e.g. Fish delivery delayed — check with supplier"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </div>
  );
}
