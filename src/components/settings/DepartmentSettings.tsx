/**
 * Phase 5A: Full CRUD for departments table.
 * Legacy source: user_departments enum (stays source of truth for role enforcement)
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSettingsCrud } from '@/hooks/useSettingsCrud';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface DeptForm {
  display_name: string;
  slug: string;
  is_active: boolean;
}

const emptyForm: DeptForm = { display_name: '', slug: '', is_active: true };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export default function DepartmentSettings() {
  const { activeHotelId } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<DeptForm>(emptyForm);

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('hotel_id', activeHotelId)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId,
  });

  const { create, update, remove } = useSettingsCrud({
    table: 'departments',
    queryKey: 'departments',
    hotelId: activeHotelId,
    label: 'Department',
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (d: { id: string; display_name: string; slug: string; is_active: boolean }) => {
    setEditingId(d.id);
    setForm({ display_name: d.display_name, slug: d.slug, is_active: d.is_active });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.display_name.trim()) return;
    const slug = form.slug || slugify(form.display_name);
    if (editingId) {
      update.mutate({ id: editingId, display_name: form.display_name, slug, is_active: form.is_active }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate({ display_name: form.display_name, slug, is_active: form.is_active }, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deletingId) remove.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
  };

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Departments</h2>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Department
        </Button>
      </div>

      {(!departments || departments.length === 0) ? (
        <p className="text-sm text-muted-foreground">No departments configured.</p>
      ) : (
        <div className="space-y-2">
          {departments.map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{d.display_name}</h4>
                <p className="text-xs text-muted-foreground">{d.slug}</p>
              </div>
              <Badge variant={d.is_active ? 'default' : 'secondary'}>
                {d.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingId(d.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Role enforcement still uses the legacy department enum. These entries are for display and future migration.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Department' : 'Add Department'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Display Name *</Label><Input value={form.display_name} onChange={e => { setForm(f => ({ ...f, display_name: e.target.value, ...(editingId ? {} : { slug: slugify(e.target.value) }) })); }} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.display_name.trim() || create.isPending || update.isPending}>
              {editingId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Department?</AlertDialogTitle>
            <AlertDialogDescription>This department will be deactivated. Role enforcement uses the legacy enum and is unaffected.</AlertDialogDescription>
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
