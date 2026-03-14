import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Check, Pencil, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DraftRelease {
  id: string;
  version: string;
  title: string;
  summary: string | null;
  content: any;
  generation_status: string;
}

export function AdminReleaseApproval() {
  const { isAdmin } = useAuth();
  const [draft, setDraft] = useState<DraftRelease | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchDraft = useCallback(async () => {
    const { data } = await supabase
      .from('release_announcements')
      .select('id, version, title, summary, content, generation_status')
      .eq('is_published', false)
      .eq('source', 'auto')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) setDraft(data as unknown as DraftRelease);
    else setDraft(null);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchDraft();

    const channel = supabase
      .channel('admin-draft-releases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'release_announcements' }, () => fetchDraft())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, fetchDraft]);

  const handleApprove = async () => {
    if (!draft) return;
    setPublishing(true);
    const { error } = await supabase
      .from('release_announcements')
      .update({ is_published: true, published_at: new Date().toISOString() } as any)
      .eq('id', draft.id);
    setPublishing(false);
    if (error) {
      toast.error('Failed to publish release');
    } else {
      toast.success('Release published — all users will see it now');
      setDraft(null);
    }
  };

  const handleEdit = () => {
    if (!draft) return;
    // Navigate to settings with the updates tab / release manager
    window.location.href = '/settings?tab=releases&edit=' + draft.id;
  };

  if (!isAdmin || !draft || dismissed) return null;

  return (
    <div className={cn(
      'border-b px-4 py-3 flex items-center justify-between gap-3',
      'bg-primary/10 border-primary/30'
    )}>
      <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <span className="font-medium shrink-0">New release ready</span>
        <span className="truncate text-muted-foreground">
          {draft.title} (v{draft.version})
          {draft.generation_status === 'fallback' && ' — auto-generated'}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="default"
          onClick={handleApprove}
          disabled={publishing}
          className="h-7 gap-1 text-xs"
        >
          <Check className="h-3.5 w-3.5" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleEdit}
          className="h-7 gap-1 text-xs"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDismissed(true)}
          className="h-7 w-7 p-0"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
