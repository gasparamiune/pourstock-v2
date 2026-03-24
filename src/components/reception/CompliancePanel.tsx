import { useState } from 'react';
import { useGuests, useGuestMutations } from '@/hooks/useReception';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Shield, Search, Loader2, UserX, AlertTriangle, Download } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// ── Helpers ───────────────────────────────────────────────────────────────────

function dataAge(visitCount: number): { label: string; badge: string } {
  // Heuristic: if no visits in a while, data may be stale
  if (visitCount === 0) return { label: 'No visits recorded', badge: 'bg-muted text-muted-foreground' };
  return { label: `${visitCount} visit${visitCount !== 1 ? 's' : ''} on record`, badge: 'bg-green-500/10 text-green-600' };
}

function hasPII(guest: any): boolean {
  return !!(guest.passport_number || guest.email || guest.phone || guest.nationality);
}

// ── Anonymise dialog ──────────────────────────────────────────────────────────

function AnonymiseDialog({
  guestId,
  guestName,
  open,
  onClose,
}: { guestId: string; guestName: string; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function anonymise() {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('guests')
        .update({
          first_name: 'Former',
          last_name: 'Guest',
          email: null,
          phone: null,
          passport_number: null,
          nationality: null,
          notes: 'Data anonymised per GDPR erasure request.',
        } as any)
        .eq('id', guestId);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['guests'] });
      toast.success('Guest data anonymised.');
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Anonymise Guest Data
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently replace all personal data for <strong>{guestName}</strong> with placeholders.
            Stay history and financial records are preserved for compliance. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={anonymise}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Anonymise
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Export guest data ─────────────────────────────────────────────────────────

async function exportGuestData(guest: any) {
  try {
    const { data: reservations } = await supabase
      .from('reservations')
      .select('id, check_in_date, check_out_date, status, rate_per_night, created_at')
      .eq('guest_id', guest.id);
    const reservationIds = (reservations ?? []).map((r: any) => r.id);
    let charges: any[] = [];
    if (reservationIds.length > 0) {
      const { data } = await supabase
        .from('room_charges')
        .select('description, amount, charge_type, created_at')
        .in('reservation_id', reservationIds);
      charges = data ?? [];
    }
    const payload = {
      export_date: new Date().toISOString(),
      guest: {
        id: guest.id,
        first_name: guest.first_name,
        last_name: guest.last_name,
        email: guest.email,
        phone: guest.phone,
        nationality: guest.nationality,
        passport_number: guest.passport_number,
      },
      reservations: reservations ?? [],
      charges,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guest-data-${guest.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Guest data exported.');
  } catch (e: any) {
    toast.error(e.message);
  }
}

// ── Guest compliance row ──────────────────────────────────────────────────────

function GuestComplianceRow({ guest }: { guest: any }) {
  const [anonOpen, setAnonOpen] = useState(false);
  const pii = hasPII(guest);
  const { label: ageLabel, badge: ageBadge } = dataAge(guest.visit_count ?? 0);
  const isAnonymised = guest.first_name === 'Former' && guest.last_name === 'Guest';

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border/40 last:border-0 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">
          {isAnonymised ? (
            <span className="text-muted-foreground italic">Anonymised guest</span>
          ) : (
            `${guest.first_name} ${guest.last_name}`
          )}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <Badge className={`text-xs border-0 ${ageBadge}`}>{ageLabel}</Badge>
          {pii && !isAnonymised && (
            <Badge className="text-xs bg-amber-500/10 text-amber-600 border-0">PII on record</Badge>
          )}
          {guest.passport_number && !isAnonymised && (
            <Badge className="text-xs bg-red-500/10 text-red-600 border-0">Passport stored</Badge>
          )}
          {isAnonymised && (
            <Badge className="text-xs bg-green-500/10 text-green-600 border-0">Anonymised</Badge>
          )}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="flex-shrink-0"
          onClick={() => exportGuestData(guest)}
        >
          <Download className="h-3.5 w-3.5 mr-1" /> Export
        </Button>
        {!isAnonymised && (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10 flex-shrink-0"
            onClick={() => setAnonOpen(true)}
          >
            <UserX className="h-3.5 w-3.5 mr-1" /> Erase
          </Button>
        )}
      </div>
      <AnonymiseDialog
        guestId={guest.id}
        guestName={`${guest.first_name} ${guest.last_name}`}
        open={anonOpen}
        onClose={() => setAnonOpen(false)}
      />
    </div>
  );
}

// ── Main CompliancePanel ──────────────────────────────────────────────────────

export function CompliancePanel() {
  const { data: guests = [], isLoading } = useGuests();
  const [search, setSearch] = useState('');

  const filtered = (guests as any[]).filter((g) => {
    const q = search.toLowerCase();
    return !q || `${g.first_name} ${g.last_name}`.toLowerCase().includes(q) || (g.email ?? '').toLowerCase().includes(q);
  });

  const withPII = (guests as any[]).filter((g) => hasPII(g) && g.first_name !== 'Former').length;
  const withPassport = (guests as any[]).filter((g) => g.passport_number && g.first_name !== 'Former').length;
  const anonymised = (guests as any[]).filter((g) => g.first_name === 'Former').length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* GDPR summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card border-border/50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{withPII}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Guests with PII</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-red-600">{withPassport}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Passport numbers stored</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-green-600">{anonymised}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Anonymised records</p>
          </CardContent>
        </Card>
      </div>

      {/* GDPR note */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 flex gap-3 items-start">
        <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">GDPR Right to Erasure</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Use the Erase button to anonymise a guest record on request. Financial and stay history is preserved
            as required by Danish bookkeeping law (Bogføringsloven). Personal data is replaced with placeholders.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search guests…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Guest list */}
      <Card className="glass-card border-border/50">
        <CardContent className="pt-2 pb-2">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No guests found.</p>
          ) : (
            filtered.map((g: any) => <GuestComplianceRow key={g.id} guest={g} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
