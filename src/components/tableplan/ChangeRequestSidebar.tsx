import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Assignments } from './assignmentAlgorithm';
import type { Reservation } from './TableCard';

interface ChangeRequest {
  id: string;
  plan_date: string;
  table_id: string;
  change_type: string;
  change_data: any;
  previous_data: any;
  status: string;
  requested_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  requester_name?: string;
}

interface ChangeRequestSidebarProps {
  planDate: string;
  onAccept: (change: ChangeRequest) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export function ChangeRequestSidebar({ planDate, onAccept, collapsed, onToggle }: ChangeRequestSidebarProps) {
  const { user, hasDepartment, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const isRestaurant = isAdmin || hasDepartment('restaurant');

  const fetchChanges = useCallback(async () => {
    const { data } = await supabase
      .from('table_plan_changes')
      .select('*')
      .eq('plan_date', planDate)
      .order('created_at', { ascending: false });
    
    if (data) {
      // Fetch requester names
      const userIds = [...new Set(data.map((c: any) => c.requested_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      const nameMap = new Map(profiles?.map((p: any) => [p.user_id, p.full_name]) || []);
      
      setChanges(data.map((c: any) => ({
        ...c,
        requester_name: nameMap.get(c.requested_by) || 'Unknown',
      })));
    }
  }, [planDate]);

  useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('change-requests-' + planDate)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_plan_changes', filter: `plan_date=eq.${planDate}` },
        () => fetchChanges()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [planDate, fetchChanges]);

  const handleAccept = async (change: ChangeRequest) => {
    const { error } = await supabase
      .from('table_plan_changes')
      .update({ 
        status: 'accepted', 
        reviewed_by: user?.id, 
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', change.id);
    
    if (!error) {
      onAccept(change);
      toast({ title: t('changeRequest.accepted') || 'Ændring godkendt' });
      fetchChanges();
    }
  };

  const handleDecline = async (change: ChangeRequest) => {
    const { error } = await supabase
      .from('table_plan_changes')
      .update({ 
        status: 'declined', 
        reviewed_by: user?.id, 
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', change.id);
    
    if (!error) {
      toast({ title: t('changeRequest.declined') || 'Ændring afvist' });
      fetchChanges();
    }
  };

  const pendingChanges = changes.filter(c => c.status === 'pending');
  const resolvedChanges = changes.filter(c => c.status !== 'pending');

  const changeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'add_reservation': '+ Reservation',
      'edit_reservation': '✏️ Redigering',
      'remove_reservation': '🗑 Fjern',
      'add_buff': '+ BUFF',
      'edit_buff': '✏️ BUFF',
      'remove_buff': '🗑 BUFF',
    };
    return labels[type] || type;
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 w-10 border-r border-border bg-card/50 shrink-0">
        <Button variant="ghost" size="icon" onClick={onToggle} className="mb-2">
          <ChevronRight className="h-4 w-4" />
        </Button>
        {pendingChanges.length > 0 && (
          <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0.5 animate-pulse">
            {pendingChanges.length}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="w-72 border-r border-border bg-card/50 flex flex-col shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('changeRequest.title') || 'Ændringsanmodninger'}
          </h3>
          {pendingChanges.length > 0 && (
            <Badge variant="secondary" className="mt-1 bg-amber-500/20 text-amber-400 text-xs">
              {pendingChanges.length} {t('changeRequest.pending') || 'afventer'}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Pending */}
          {pendingChanges.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {t('changeRequest.noPending') || 'Ingen ventende ændringer'}
            </p>
          )}
          {pendingChanges.map(change => (
            <div key={change.id} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {changeTypeLabel(change.change_type)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(change.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Bord {change.table_id.replace('B', '')}</span>
                {change.change_data?.guestName && (
                  <span className="text-muted-foreground ml-1">· {change.change_data.guestName}</span>
                )}
                {change.change_data?.guestCount && (
                  <span className="text-muted-foreground ml-1">· {change.change_data.guestCount}p</span>
                )}
                {change.change_data?.roomNumber && (
                  <span className="text-muted-foreground ml-1">· Vær.{change.change_data.roomNumber}</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Fra: {change.requester_name}
              </div>
              {isRestaurant && (
                <div className="flex gap-2">
                  <Button size="sm" variant="default" className="flex-1 h-7 text-xs" onClick={() => handleAccept(change)}>
                    <Check className="h-3 w-3 mr-1" /> {t('changeRequest.accept') || 'Godkend'}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs text-destructive" onClick={() => handleDecline(change)}>
                    <X className="h-3 w-3 mr-1" /> {t('changeRequest.decline') || 'Afvis'}
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Resolved */}
          {resolvedChanges.length > 0 && (
            <>
              <div className="text-xs text-muted-foreground font-medium pt-3 pb-1">
                {t('changeRequest.resolved') || 'Behandlede'}
              </div>
              {resolvedChanges.slice(0, 10).map(change => (
                <div key={change.id} className={cn(
                  "rounded-lg border p-2.5 space-y-1",
                  change.status === 'accepted' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-destructive/20 bg-destructive/5'
                )}>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {changeTypeLabel(change.change_type)}
                    </Badge>
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      change.status === 'accepted' ? 'text-emerald-400' : 'text-destructive'
                    )}>
                      {change.status === 'accepted' ? '✓' : '✗'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Bord {change.table_id.replace('B', '')} · {change.requester_name}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
