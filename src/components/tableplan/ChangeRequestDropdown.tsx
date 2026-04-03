import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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

interface ChangeRequestDropdownProps {
  planDate: string;
  onAccept: (change: ChangeRequest) => void;
}

export function ChangeRequestDropdown({ planDate, onAccept }: ChangeRequestDropdownProps) {
  const { user, hasDepartment, isAdmin } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [open, setOpen] = useState(false);
  const isRestaurant = isAdmin || hasDepartment('restaurant');

  const fetchChanges = useCallback(async () => {
    const { data } = await supabase
      .from('table_plan_changes')
      .select('*')
      .eq('plan_date', planDate)
      .order('created_at', { ascending: false });
    
    if (data) {
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
      toast({ title: 'Ændring godkendt ✓' });
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
      toast({ title: 'Ændring afvist ✗' });
      fetchChanges();
    }
  };

  const pendingChanges = changes.filter(c => c.status === 'pending');

  const changeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'add_reservation': '+ Reservation',
      'edit_reservation': '✏️ Ændring',
      'remove_reservation': '🗑 Fjern',
      'add_buff': '+ BUFF',
      'edit_buff': '✏️ BUFF',
      'remove_buff': '🗑 BUFF',
    };
    return labels[type] || type;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-3.5 w-3.5" />
          Ændringer
          {pendingChanges.length > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 animate-pulse">
              {pendingChanges.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="p-3 border-b border-border">
          <h4 className="text-sm font-semibold">Ændringsanmodninger</h4>
          <p className="text-xs text-muted-foreground">
            {pendingChanges.length > 0
              ? `${pendingChanges.length} afventer godkendelse`
              : 'Ingen ventende ændringer'}
          </p>
        </div>
        <ScrollArea className="max-h-80">
          <div className="p-2 space-y-1.5">
            {pendingChanges.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                Ingen ændringer endnu
              </p>
            )}
            {pendingChanges.map(change => (
              <div key={change.id} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {changeTypeLabel(change.change_type)}
                    </Badge>
                    <span className="text-xs font-medium">
                      Bord {change.table_id.replace(/^[BA]/, '')}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(change.created_at).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  {change.change_data?.guestName && <span>{change.change_data.guestName}</span>}
                  {change.change_data?.guestCount && <span>· {change.change_data.guestCount}p</span>}
                  {change.change_data?.roomNumber && <span>· Vær.{change.change_data.roomNumber}</span>}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Fra: <span className="font-medium">{change.requester_name}</span> · Reception
                </div>
                {isRestaurant && (
                  <div className="flex gap-1.5 pt-0.5">
                    <Button size="sm" variant="default" className="flex-1 h-6 text-[10px] px-2" onClick={() => handleAccept(change)}>
                      <Check className="h-3 w-3 mr-0.5" /> Godkend
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-6 text-[10px] px-2 text-destructive" onClick={() => handleDecline(change)}>
                      <X className="h-3 w-3 mr-0.5" /> Afvis
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
