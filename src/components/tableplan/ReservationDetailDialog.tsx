import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, DoorOpen, UtensilsCrossed, Pencil, Trash2 } from 'lucide-react';
import { getReservationTypeLabel, type ReservationType } from './cutleryUtils';
import type { Reservation } from './TableCard';

interface ReservationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableLabel: string;
  reservation: Reservation;
  onEdit: (reservation: Reservation) => void;
  onRemove: () => void;
}

export function ReservationDetailDialog({ open, onOpenChange, tableLabel, reservation, onEdit, onRemove }: ReservationDetailDialogProps) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [guestName, setGuestName] = useState(reservation.guestName);
  const [guestCount, setGuestCount] = useState(String(reservation.guestCount));
  const [roomNumber, setRoomNumber] = useState(reservation.roomNumber);
  const [reservationType, setReservationType] = useState<ReservationType>(reservation.reservationType || '3-ret');
  const [notes, setNotes] = useState(reservation.notes);

  const handleSave = () => {
    onEdit({
      ...reservation,
      guestName,
      guestCount: parseInt(guestCount) || 2,
      roomNumber,
      reservationType,
      dishCount: reservationType === '2-ret' ? 2 : reservationType === '4-ret' ? 4 : 3,
      notes,
    });
    setEditing(false);
  };

  const handleRemove = () => {
    onRemove();
    onOpenChange(false);
  };

  if (editing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('common.edit')} — {t('tablePlan.table')} {tableLabel}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('tablePlan.guestName')}</Label>
              <Input value={guestName} onChange={e => setGuestName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t('tablePlan.guestCount')}</Label>
                <Input type="number" min="1" max="20" value={guestCount} onChange={e => setGuestCount(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('tablePlan.roomNumber')}</Label>
                <Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t('tablePlan.type')}</Label>
              <Select value={reservationType} onValueChange={v => setReservationType(v as ReservationType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2-ret">2-ret</SelectItem>
                  <SelectItem value="3-ret">3-ret</SelectItem>
                  <SelectItem value="4-ret">4-ret</SelectItem>
                  <SelectItem value="a-la-carte">A la carte</SelectItem>
                  <SelectItem value="bordreservation">Bordreservation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{t('tablePlan.notes')}</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('tablePlan.table')} {tableLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {reservation.guestName && (
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
              {reservation.guestName}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {reservation.guestCount} {t('tablePlan.guests')}</span>
            <span className="flex items-center gap-1"><UtensilsCrossed className="h-4 w-4" /> {getReservationTypeLabel(reservation.reservationType || '3-ret')}</span>
            {reservation.roomNumber && (
              <span className="flex items-center gap-1"><DoorOpen className="h-4 w-4" /> {t('tablePlan.room')} {reservation.roomNumber}</span>
            )}
          </div>
          {reservation.notes && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {reservation.notes}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="destructive" size="sm" onClick={handleRemove}>
            <Trash2 className="h-4 w-4 mr-1" /> {t('tablePlan.remove')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-1" /> {t('common.edit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
