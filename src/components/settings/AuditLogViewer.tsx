import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Search } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  user_id: string;
  details: any;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  'user.create': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'user.delete': 'bg-destructive/15 text-destructive',
  'user.approve': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'user.deny': 'bg-destructive/15 text-destructive',
  'role.change': 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'hotel.create': 'bg-primary/15 text-primary',
  'table_layout.update': 'bg-primary/15 text-primary',
};

export default function AuditLogViewer() {
  const { activeHotelId } = useAuth();
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('hotel_id', activeHotelId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as AuditLog[];
    },
    enabled: !!activeHotelId,
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();

  const filtered = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.target_id?.toLowerCase().includes(q) ||
        JSON.stringify(log.details).toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Audit Logs</h2>
        <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
      </div>

      {/* Filters */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label className="text-xs">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions, targets…"
              className="pl-9"
            />
          </div>
        </div>
        <div className="w-48">
          <Label className="text-xs">Action</Label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {uniqueActions.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Log List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <Shield className="h-12 w-12 opacity-40" />
          <p className="text-sm">No audit logs found.</p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-2 pr-3">
            {filtered.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-secondary/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                  </span>
                </div>
                {log.target_type && (
                  <p className="text-xs text-muted-foreground">
                    {log.target_type}: {log.target_id?.slice(0, 8)}…
                  </p>
                )}
                {log.details && Object.keys(log.details).length > 0 && (
                  <pre className="text-xs text-muted-foreground/70 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
