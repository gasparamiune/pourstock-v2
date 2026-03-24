import { useState } from 'react';
import { useReservations, useRoomCharges } from '@/hooks/useReception';
import { AddChargeDialog } from './AddChargeDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Receipt, CreditCard, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';

function nightCount(checkIn: string, checkOut: string) {
  return Math.max(1, differenceInCalendarDays(new Date(checkOut), new Date(checkIn)));
}

function currencyDKK(amount: number) {
  return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(amount);
}

// ── Per-reservation folio row ─────────────────────────────────────────────────

function ReservationFolio({ reservation }: { reservation: any }) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { data: charges = [], isLoading } = useRoomCharges(open ? reservation.id : undefined);

  const nights = nightCount(reservation.check_in_date, reservation.check_out_date);
  const roomTotal = (reservation.rate_per_night ?? 0) * nights;
  const chargesTotal = charges.reduce((s: number, c: any) => s + c.amount, 0);
  const grandTotal = roomTotal + chargesTotal;

  const paymentColor: Record<string, string> = {
    paid: 'bg-green-500/10 text-green-600 border-green-500/30',
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    partial: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    refunded: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {reservation.guest?.first_name} {reservation.guest?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">
              Room {reservation.room?.room_number} · {format(new Date(reservation.check_in_date), 'MMM d')} – {format(new Date(reservation.check_out_date), 'MMM d')} ({nights} {nights === 1 ? 'night' : 'nights'})
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-bold text-sm">{currencyDKK(grandTotal)}</span>
            <Badge className={`text-xs border ${paymentColor[reservation.payment_status] ?? paymentColor.pending}`}>
              {reservation.payment_status}
            </Badge>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0 space-y-4">
          <div className="rounded-lg border border-border/40 divide-y divide-border/30 text-sm overflow-hidden">
            {/* Room rate line */}
            <div className="flex justify-between px-3 py-2 bg-muted/20">
              <span className="text-muted-foreground">
                Room rate ({nights} × {currencyDKK(reservation.rate_per_night ?? 0)})
              </span>
              <span className="font-medium">{currencyDKK(roomTotal)}</span>
            </div>

            {/* Additional charges */}
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : (
              charges.map((c: any) => (
                <div key={c.id} className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">{c.description}</span>
                  <span>{currencyDKK(c.amount)}</span>
                </div>
              ))
            )}

            {/* Total */}
            <div className="flex justify-between px-3 py-2 bg-muted/30 font-semibold">
              <span>Total</span>
              <span>{currencyDKK(grandTotal)}</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-1" /> Add Charge
            </Button>
            <Button size="sm" variant="outline">
              <Receipt className="h-4 w-4 mr-1" /> Print Invoice
            </Button>
            <Button size="sm">
              <CreditCard className="h-4 w-4 mr-1" /> Mark Paid
            </Button>
          </div>
        </CardContent>
      )}

      <AddChargeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        reservationId={reservation.id}
      />
    </Card>
  );
}

// ── Main FolioSheet ───────────────────────────────────────────────────────────

export function FolioSheet() {
  const today = new Date().toISOString().split('T')[0];
  // Show current + recent stays (from 30 days ago)
  const past30 = new Date(Date.now() - 30 * 86400_000).toISOString().split('T')[0];
  const { data: reservations = [], isLoading } = useReservations({ from: past30, to: today });

  const [statusFilter, setStatusFilter] = useState('checked_in');

  const filtered = (reservations as any[]).filter((r) =>
    statusFilter === 'all' ? true : r.status === statusFilter
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Guest Folios</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No reservations found for this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r: any) => (
            <ReservationFolio key={r.id} reservation={r} />
          ))}
        </div>
      )}
    </div>
  );
}
