import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Globe, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  name: string;
  description: string;
  allergens: string;
  price: number;
}

interface DailyMenu {
  id: string;
  hotel_id: string;
  menu_date: string;
  starters: MenuItem[];
  mains: MenuItem[];
  desserts: MenuItem[];
  published_at: string | null;
  notes: string | null;
}

function emptyItem(): MenuItem {
  return { id: crypto.randomUUID(), name: '', description: '', allergens: '', price: 0 };
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
  function updateItem(index: number, field: keyof MenuItem, value: string | number) {
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
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Allergens (e.g. gluten, dairy)"
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
            </div>
          </div>
        ))}

        {items.length < max && (
          <Button size="sm" variant="outline" className="w-full" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Add {title.replace(/s$/, '')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main DailyMenuEditor ──────────────────────────────────────────────────────

export function DailyMenuEditor() {
  const today = new Date().toISOString().split('T')[0];
  const { data: menu, isLoading } = useTodayMenu(today);
  const { saveMenu, publishMenu } = useMenuMutations(today);

  const [starters, setStarters] = useState<MenuItem[]>([]);
  const [mains, setMains] = useState<MenuItem[]>([]);
  const [desserts, setDesserts] = useState<MenuItem[]>([]);
  const [notes, setNotes] = useState('');

  // Sync state when menu loads
  useEffect(() => {
    if (menu) {
      setStarters(menu.starters ?? []);
      setMains(menu.mains ?? []);
      setDesserts(menu.desserts ?? []);
      setNotes(menu.notes ?? '');
    }
  }, [menu]);

  function handleSave() {
    saveMenu.mutate({ id: menu?.id, starters, mains, desserts, notes });
  }

  function handlePublish() {
    if (!menu?.id) { toast.error('Save the menu first before publishing.'); return; }
    publishMenu.mutate(menu.id);
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isPublished = !!menu?.published_at;

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`rounded-xl px-4 py-3 flex items-center justify-between gap-3 ${
        isPublished ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/30 border border-border/40'
      }`}>
        <div className="flex items-center gap-2 text-sm">
          {isPublished ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-700 font-medium">Published</span>
              <span className="text-muted-foreground">
                · {format(new Date(menu!.published_at!), 'HH:mm')} · Menu is live for ordering
              </span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Draft — not yet visible to waiters</span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saveMenu.isPending}>
            {saveMenu.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Save
          </Button>
          {!isPublished && (
            <Button size="sm" onClick={handlePublish} disabled={publishMenu.isPending || starters.length + mains.length + desserts.length === 0}>
              Publish Menu
            </Button>
          )}
        </div>
      </div>

      {/* Course editors */}
      <div className="grid lg:grid-cols-3 gap-4">
        <CourseSection
          title="Starters"
          color="text-blue-600"
          items={starters}
          max={3}
          onChange={setStarters}
        />
        <CourseSection
          title="Mains"
          color="text-primary"
          items={mains}
          max={3}
          onChange={setMains}
        />
        <CourseSection
          title="Desserts"
          color="text-pink-600"
          items={desserts}
          max={3}
          onChange={setDesserts}
        />
      </div>

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
