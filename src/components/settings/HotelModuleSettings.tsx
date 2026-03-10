/**
 * Phase 5B: Hotel Modules settings with safety UX.
 * - Confirmation dialog before disabling
 * - Cannot disable the last visible module
 * - Undo toast not needed (confirmation dialog is sufficient)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Blocks, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const MODULE_LABELS: Record<string, string> = {
  inventory: 'Inventory',
  table_plan: 'Table Plan',
  reception: 'Reception',
  housekeeping: 'Housekeeping',
  reports: 'Reports',
  orders: 'Purchase Orders',
  products: 'Products',
  import: 'Import',
  user_management: 'User Management',
  settings: 'Settings',
};

export default function HotelModuleSettings() {
  const { activeHotelId } = useAuth();
  const qc = useQueryClient();
  const [confirmModule, setConfirmModule] = useState<{ id: string; module: string; newState: boolean } | null>(null);

  const { data: modules, isLoading } = useQuery({
    queryKey: ['hotel-modules-settings', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hotel_modules')
        .select('*')
        .eq('hotel_id', activeHotelId)
        .order('module');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!activeHotelId,
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase.from('hotel_modules').update({ is_enabled }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-modules-settings', activeHotelId] });
      qc.invalidateQueries({ queryKey: ['hotel-modules', activeHotelId] }); // refresh nav
      toast.success('Module updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleToggle = (mod: any) => {
    const newState = !mod.is_enabled;
    if (!newState) {
      // Disabling — check if this is the last enabled module
      const enabledCount = (modules ?? []).filter(m => m.is_enabled).length;
      if (enabledCount <= 1) {
        toast.error('Cannot disable the last active module');
        return;
      }
      setConfirmModule({ id: mod.id, module: mod.module, newState });
    } else {
      toggle.mutate({ id: mod.id, is_enabled: true });
    }
  };

  const confirmDisable = () => {
    if (confirmModule) {
      toggle.mutate({ id: confirmModule.id, is_enabled: confirmModule.newState });
      setConfirmModule(null);
    }
  };

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <h2 className="font-display font-semibold text-lg">Hotel Modules</h2>

      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
        <p className="text-sm text-muted-foreground">Disabling a module hides it from all staff. Only hotel admins can change this.</p>
      </div>

      {(!modules || modules.length === 0) ? (
        <div className="text-center py-8">
          <Blocks className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No modules configured.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map((mod) => (
            <div key={mod.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Blocks className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{MODULE_LABELS[mod.module] ?? mod.module}</h4>
                  <p className="text-xs text-muted-foreground">{mod.module}</p>
                </div>
              </div>
              <Switch
                checked={mod.is_enabled}
                onCheckedChange={() => handleToggle(mod)}
                disabled={toggle.isPending}
              />
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmModule} onOpenChange={o => !o && setConfirmModule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable {confirmModule ? (MODULE_LABELS[confirmModule.module] ?? confirmModule.module) : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This module will be hidden from all staff members. Only hotel admins can re-enable it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDisable}>Disable Module</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
