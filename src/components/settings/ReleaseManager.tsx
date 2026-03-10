import { useState } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Send, Pencil, Trash2, Eye, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { ReleaseAnnouncement } from '@/hooks/useReleaseAnnouncements';

// Simple filtering function: removes obviously technical lines
function filterUserFacingNotes(raw: string): string {
  const technicalPatterns = [
    /refactor/i,
    /^(added|created|updated) index/i,
    /migration/i,
    /rls polic/i,
    /schema/i,
    /dual.write/i,
    /parity view/i,
    /hook (structure|refactor)/i,
    /security.definer/i,
    /eslint|prettier|lint/i,
    /config\.toml/i,
    /readme|documentation/i,
    /types\.ts/i,
    /dependency (update|bump)/i,
    /^bump/i,
    /internal/i,
  ];

  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      return !technicalPatterns.some((p) => p.test(line));
    })
    .slice(0, 7)
    .join('\n');
}

export function ReleaseManager() {
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [severity, setSeverity] = useState('info');
  const [audienceType, setAudienceType] = useState('all');
  const [isMandatory, setIsMandatory] = useState(false);
  const [isSilent, setIsSilent] = useState(false);

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['admin-releases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('release_announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as ReleaseAnnouncement[];
    },
    enabled: isAdmin,
  });

  const resetForm = () => {
    setVersion('');
    setTitle('');
    setSummary('');
    setContent('');
    setRawNotes('');
    setSeverity('info');
    setAudienceType('all');
    setIsMandatory(false);
    setIsSilent(false);
    setEditingId(null);
    setShowForm(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        version,
        title,
        summary: summary || null,
        content,
        severity,
        audience_type: audienceType,
        is_mandatory: isMandatory,
        is_silent: isSilent,
        raw_release_notes: rawNotes || null,
        user_facing_notes: content,
        source: 'manual',
        created_by: user?.id ?? null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('release_announcements')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('release_announcements')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? 'Release updated' : 'Release saved as draft' });
      queryClient.invalidateQueries({ queryKey: ['admin-releases'] });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('release_announcements')
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Release published!' });
      queryClient.invalidateQueries({ queryKey: ['admin-releases'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('release_announcements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Release deleted' });
      queryClient.invalidateQueries({ queryKey: ['admin-releases'] });
    },
  });

  const handleFilterRawNotes = () => {
    if (!rawNotes.trim()) return;
    const filtered = filterUserFacingNotes(rawNotes);
    setContent(filtered);
  };

  const startEdit = (r: ReleaseAnnouncement) => {
    setEditingId(r.id);
    setVersion(r.version);
    setTitle(r.title);
    setSummary(r.summary ?? '');
    setContent(r.content);
    setRawNotes(r.raw_release_notes ?? '');
    setSeverity(r.severity);
    setAudienceType(r.audience_type);
    setIsMandatory(r.is_mandatory);
    setIsSilent(r.is_silent);
    setShowForm(true);
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Release Announcements</h3>
          <p className="text-sm text-muted-foreground">
            Manage what users see after deployments
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Release
        </Button>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(v) => { if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Release' : 'New Release Announcement'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Version</Label>
                <Input
                  placeholder="2026-03-10-v1"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="What's new in PourStock"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Summary (optional subtitle)</Label>
              <Input
                placeholder="A quick look at the latest improvements"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Raw / Technical Notes (paste deployment notes here)</Label>
              <Textarea
                placeholder="Paste raw release notes or commit messages here..."
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                rows={4}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleFilterRawNotes}
                disabled={!rawNotes.trim()}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Filter to user-facing notes
              </Button>
            </div>

            <div className="space-y-2">
              <Label>User-Facing Content (one item per line, max 7 shown)</Label>
              <Textarea
                placeholder="🎯 New check-in flow with better room status&#10;📄 Fixed PDF import for some reservation formats&#10;🖨️ Improved print layout"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select value={audienceType} onValueChange={setAudienceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="role">By Role</SelectItem>
                    <SelectItem value="hotel">By Hotel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
                <Label>Mandatory (must acknowledge)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isSilent} onCheckedChange={setIsSilent} />
                <Label>Silent (no popup)</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!version || !title || !content || saveMutation.isPending}
              >
                {editingId ? 'Update Draft' : 'Save Draft'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Releases List */}
      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {releases.map((r) => (
          <Card key={r.id} className={cn(!r.is_published && 'border-dashed opacity-80')}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <Badge variant="outline" className="text-xs">v{r.version}</Badge>
                  <Badge
                    variant={r.is_published ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {r.is_published ? 'Published' : 'Draft'}
                  </Badge>
                  {r.is_mandatory && (
                    <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                  )}
                  {r.is_silent && (
                    <Badge variant="outline" className="text-xs">Silent</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => startEdit(r)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!r.is_published && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary"
                      onClick={() => publishMutation.mutate(r.id)}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate(r.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {r.summary && (
                <CardDescription>{r.summary}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="line-clamp-2 whitespace-pre-line">{r.content}</p>
              <p className="text-xs mt-2">
                {r.published_at
                  ? `Published ${new Date(r.published_at).toLocaleString()}`
                  : `Created ${new Date(r.created_at).toLocaleString()}`}
                {' · '}{r.audience_type} · {r.severity}
              </p>
            </CardContent>
          </Card>
        ))}
        {!isLoading && releases.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No release announcements yet. Create one to notify users about updates.
          </p>
        )}
      </div>
    </div>
  );
}
