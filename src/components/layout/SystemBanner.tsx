import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Info, X, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SystemNotice {
  id: string;
  notice_type: string;
  title: string;
  message: string;
}

const iconMap: Record<string, React.ElementType> = {
  maintenance: Wrench,
  warning: AlertTriangle,
  info: Info,
};

const styleMap: Record<string, string> = {
  maintenance: 'bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200',
  warning: 'bg-destructive/10 border-destructive/30 text-destructive',
  info: 'bg-primary/10 border-primary/30 text-primary',
};

export function SystemBanner() {
  const [notices, setNotices] = useState<SystemNotice[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchNotices = async () => {
    const { data } = await supabase
      .from('system_notices')
      .select('id, notice_type, title, message')
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());
    if (data) setNotices(data);
  };

  useEffect(() => {
    fetchNotices();

    const channel = supabase
      .channel('system-notices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_notices' }, () => fetchNotices())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const visible = notices.filter(n => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map(notice => {
        const Icon = iconMap[notice.notice_type] || Info;
        const style = styleMap[notice.notice_type] || styleMap.info;
        return (
          <div key={notice.id} className={cn('border-b px-4 py-3 flex items-center justify-between gap-3', style)}>
            <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="font-medium shrink-0">{notice.title}</span>
              <span className="truncate">{notice.message}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(prev => new Set(prev).add(notice.id))}
              className="h-7 w-7 p-0 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </>
  );
}
