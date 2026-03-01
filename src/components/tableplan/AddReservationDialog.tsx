import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShieldAlert } from 'lucide-react';
import { QuickNoteButtons } from './QuickNoteButtons';
import type { Reservation } from './TableCard';
import type { ReservationType } from './cutleryUtils';

interface AddReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableLabel: string;
  tableCapacity?: number;
  onAdd: (reservation: Reservation) => void;
}

export function AddReservationDialog({ open, onOpenChange, tableLabel, tableCapacity = 2, onAdd }: AddReservationDialogProps) {
  const { t } = useLanguage();
  const [guestName, setGuestName] = useState('');
  const [guestCount, setGuestCount] = useState('2');
  const [roomNumber, setRoomNumber] = useState('');
  const [reservationType, setReservationType] = useState<ReservationType>('3-ret');
  const [notes, setNotes] = useState('');
  const [coffeeOnly, setCoffeeOnly] = useState(false);
  const [coffeeTeaSweet, setCoffeeTeaSweet] = useState(false);

  const handleSubmit = () => {
    const reservation: Reservation = {
      time: '18:00',
      guestCount: parseInt(guestCount) || 2,
      dishCount: reservationType === '2-ret' ? 2 : reservationType === '4-ret' ? 4 : 3,
      reservationType,
      guestName,
      roomNumber,
      notes,
      coffeeOnly,
      coffeeTeaSweet,
    };
    onAdd(reservation);
    resetForm();
  };

  const handleMarkAsBuff = () => {
    const reservation: Reservation = {
      time: '18:00',
      guestCount: tableCapacity,
      dishCount: 3,
      reservationType: 'buff',
      guestName: 'BUFF',
      roomNumber: '',
      notes: '',
    };
    onAdd(reservation);
    resetForm();
  };

  const resetForm = () => {
    setGuestName('');
    setGuestCount('2');
    setRoomNumber('');
    setReservationType('3-ret');
    setNotes('');
    setCoffeeOnly(false);
    setCoffeeTeaSweet(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('tablePlan.addReservation')} — {t('tablePlan.table')} {tableLabel}</DialogTitle>
        </DialogHeader>

        <Button
          variant="outline"
          onClick={handleMarkAsBuff}
          className="w-full border-rose-500/40 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border-dashed"
        >
          <ShieldAlert className="h-4 w-4 mr-2" />
          {t('tablePlan.markAsBuff')} ({tableCapacity}p)
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">eller</span>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t('tablePlan.guestName')}</Label>
            <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder={t('tablePlan.guestName')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t('tablePlan.guestCount')}</Label>
              <Input type="number" min="1" max="20" value={guestCount} onChange={e => setGuestCount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t('tablePlan.roomNumber')}</Label>
              <Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="102" />
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

          <QuickNoteButtons
            coffeeOnly={coffeeOnly}
            coffeeTeaSweet={coffeeTeaSweet}
            notes={notes}
            onCoffeeOnlyChange={setCoffeeOnly}
            onCoffeeTeaSweetChange={setCoffeeTeaSweet}
            onNotesChange={setNotes}
          />

          <div className="grid gap-2">
            <Label>{t('tablePlan.notes')}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('tablePlan.notes')} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
