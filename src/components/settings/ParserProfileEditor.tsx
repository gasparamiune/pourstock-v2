import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ParserProfile {
  id: string;
  name: string;
  config_json: any;
  is_default: boolean;
}

export default function ParserProfileEditor() {
  const { activeHotelId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ParserProfile | null>(null);
  const [name, setName] = useState('');
  const [configJson, setConfigJson] = useState('{}');
  const [isDefault, setIsDefault] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['parser-profiles', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parser_profiles')
        .select('id, name, config_json, is_default')
        .eq('hotel_id', activeHotelId)
        .order('name');
      if (error) throw error;
      return data as ParserProfile[];
    },
    enabled: !!activeHotelId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let parsed: any;
      try {
        parsed = JSON.parse(configJson);
      } catch {
        throw new Error('Invalid JSON in configuration');
      }

      if (editing) {
        const { error } = await supabase
          .from('parser_profiles')
          .update({ name, config_json: parsed, is_default: isDefault })
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('parser_profiles')
          .insert({ hotel_id: activeHotelId, name, config_json: parsed, is_default: isDefault });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parser-profiles', activeHotelId] });
      setDialogOpen(false);
      toast.success(editing ? 'Profile updated' : 'Profile created');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parser_profiles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parser-profiles', activeHotelId] });
      toast.success('Profile deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openNew() {
    setEditing(null);
    setName('');
    setConfigJson('{\n  "prompt_template": "",\n  "expected_fields": ["guestName", "roomNumber", "guestCount", "courseType", "dietaryNotes"]\n}');
    setIsDefault(profiles.length === 0);
    setDialogOpen(true);
  }

  function openEdit(p: ParserProfile) {
    setEditing(p);
    setName(p.name);
    setConfigJson(JSON.stringify(p.config_json, null, 2));
    setIsDefault(p.is_default);
    setDialogOpen(true);
  }

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Parser Profiles</h2>
        <Button size="sm" variant="outline" className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add Profile
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Parser profiles configure how AI extracts reservation data from uploaded PDFs. Each hotel can have multiple profiles for different formats.
      </p>

      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <FileText className="h-12 w-12 opacity-40" />
          <p className="text-sm">No parser profiles configured. Create one to customize PDF parsing.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium text-sm">{p.name}</h3>
                  {p.is_default && (
                    <span className="text-xs text-primary font-medium">Default</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate(p.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'New Parser Profile'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Profile Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sønderborg Format" />
            </div>
            <div>
              <Label>Configuration (JSON)</Label>
              <Textarea
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
                className="font-mono text-xs min-h-[160px]"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              <Label>Set as default profile</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!name.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
