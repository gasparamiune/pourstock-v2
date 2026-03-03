import { useState } from 'react';
import { useRooms, useReservations, useRoomMutations, type Room, type Reservation } from '@/hooks/useReception';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckInDialog } from './CheckInDialog';
import { CheckOutDialog } from './CheckOutDialog';
import { Loader2, User, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const statusDot: Record<string, string> = {
  available: 'bg-[hsl(var(--room-available))]',
  occupied: 'bg-[hsl(var(--room-occupied))]',
  checkout: 'bg-[hsl(var(--room-checkout))]',
  maintenance: 'bg-[hsl(var(--room-maintenance))]',
  reserved: 'bg-[hsl(var(--room-reserved))]',
};

const statusBorder: Record<string, string> = {
  available: 'border-l-[hsl(var(--room-available))]',
  occupied: 'border-l-[hsl(var(--room-occupied))]',
  checkout: 'border-l-[hsl(var(--room-checkout))]',
  maintenance: 'border-l-[hsl(var(--room-maintenance))]',
  reserved: 'border-l-[hsl(var(--room-reserved))]',
};

const roomTypeLabels: Record<string, string> = {
  single: 'Single',
  double: 'Double',
  twin: 'Twin',
  suite: 'Suite',
  family: 'Family',
};

function NotePopover({ room, onSave }: { room: Room; onSave: (id: string, notes: string) => void }) {
  const { t } = useLanguage();
  const [value, setValue] = useState(room.notes || '');
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "p-1 rounded hover:bg-muted transition-colors",
          room.notes ? "text-primary" : "text-muted-foreground/40"
        )}>
          <StickyNote className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <Textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={t('reception.addNote')}
          rows={3}
          className="text-sm"
        />
        <Button
          size="sm"
          className="mt-2 w-full"
          onClick={() => { onSave(room.id, value); setOpen(false); }}
        >
          {t('common.save')}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function RoomBoard() {
  const { t } = useLanguage();
  const { data: rooms, isLoading } = useRooms();
  const { data: reservations } = useReservations();
  const { updateRoom } = useRoomMutations();
  const { toast } = useToast();
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [dialogType, setDialogType] = useState<'checkin' | 'checkout' | null>(null);

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const floors = [...new Set((rooms || []).map(r => r.floor))].sort();
  const floorRooms = (rooms || []).filter(r => r.floor === activeFloor).sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));

  const roomReservationMap = new Map<string, Reservation>();
  (reservations || []).forEach(res => {
    if (res.status === 'confirmed' || res.status === 'checked_in') {
      roomReservationMap.set(res.room_id, res);
    }
  });

  const handleRoomAction = (room: Room) => {
    setSelectedRoom(room);
    if (room.status === 'occupied') setDialogType('checkout');
    else if (room.status === 'available' || room.status === 'reserved') setDialogType('checkin');
  };

  const handleSaveNotes = (roomId: string, notes: string) => {
    updateRoom.mutate({ id: roomId, notes } as any);
    toast({ title: t('common.save') });
  };

  // Floor summary counts
  const floorCounts = (flr: number) => {
    const rs = (rooms || []).filter(r => r.floor === flr);
    return {
      total: rs.length,
      available: rs.filter(r => r.status === 'available').length,
      occupied: rs.filter(r => r.status === 'occupied').length,
    };
  };

  return (
    <div className="space-y-4">
      {/* Floor tabs */}
      <div className="flex gap-2">
        {floors.map(f => {
          const c = floorCounts(f);
          return (
            <button
              key={f}
              onClick={() => setActiveFloor(f)}
              className={cn(
                "px-4 py-2.5 rounded-xl font-medium transition-all text-sm",
                activeFloor === f
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {t('reception.floor')} {f}
              <span className="ml-2 text-xs opacity-70">({c.available}/{c.total})</span>
            </button>
          );
        })}
      </div>

      {/* Room table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">{t('reception.room')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('tablePlan.type')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('users.status')}</th>
              <th className="text-left px-4 py-3 font-medium">{t('reception.guestName')}</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{t('reception.checkIn')}/{t('reception.checkOut')}</th>
              <th className="text-center px-4 py-3 font-medium w-10">{t('reception.notes')}</th>
              <th className="text-right px-4 py-3 font-medium">{t('users.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {floorRooms.map(room => {
              const res = roomReservationMap.get(room.id);
              const guestName = res?.guest ? `${res.guest.first_name} ${res.guest.last_name}` : null;
              const canAct = room.status === 'available' || room.status === 'occupied' || room.status === 'reserved';
              return (
                <tr
                  key={room.id}
                  className={cn(
                    "border-l-4 hover:bg-muted/20 transition-colors",
                    statusBorder[room.status] || 'border-l-muted'
                  )}
                >
                  <td className="px-4 py-3 font-bold text-foreground">{room.room_number}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {roomTypeLabels[room.room_type] || room.room_type} · {room.capacity}p
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full", statusDot[room.status])} />
                      <span className="capitalize text-foreground/80">{t(`reception.${room.status}`)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {guestName ? (
                      <div className="flex items-center gap-1.5 text-foreground">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{guestName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                    {res ? `${res.check_in_date} → ${res.check_out_date}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <NotePopover room={room} onSave={handleSaveNotes} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canAct && (
                      <Button
                        size="sm"
                        variant={room.status === 'occupied' ? 'destructive' : 'default'}
                        onClick={() => handleRoomAction(room)}
                        className="h-7 text-xs"
                      >
                        {room.status === 'occupied' ? t('reception.checkOut') : t('reception.checkIn')}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {floorRooms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">{t('reception.noRooms')}</div>
      )}

      {/* Dialogs */}
      {selectedRoom && dialogType === 'checkin' && (
        <CheckInDialog
          open={true}
          onOpenChange={() => { setSelectedRoom(null); setDialogType(null); }}
          room={selectedRoom}
          reservation={roomReservationMap.get(selectedRoom.id)}
        />
      )}
      {selectedRoom && dialogType === 'checkout' && (
        <CheckOutDialog
          open={true}
          onOpenChange={() => { setSelectedRoom(null); setDialogType(null); }}
          room={selectedRoom}
          reservation={roomReservationMap.get(selectedRoom.id)}
        />
      )}
    </div>
  );
}
