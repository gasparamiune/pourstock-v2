import { cn } from '@/lib/utils';
import { AlertTriangle, Users, UtensilsCrossed, DoorOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getReservationTypeColor, getReservationTypeLabel, type ReservationType } from './cutleryUtils';

export interface Reservation {
  time: string;
  guestCount: number;
  dishCount: number;
  reservationType?: ReservationType;
  guestName: string;
  roomNumber: string;
  notes: string;
}

export interface TableDef {
  id: string;
  capacity: number;
  row: number;
  col: number;
}

interface TableCardProps {
  table: TableDef;
  reservation?: Reservation;
}

function getEffectiveType(reservation: Reservation): ReservationType {
  if (reservation.reservationType) return reservation.reservationType;
  // Backward compatibility
  if (reservation.dishCount === 2) return '2-ret';
  if (reservation.dishCount === 4) return '4-ret';
  return '3-ret';
}

export function TableCard({ table, reservation }: TableCardProps) {
  const { t } = useLanguage();
  const isFree = !reservation;
  const hasNotes = reservation?.notes && reservation.notes.trim().length > 0;

  const type = reservation ? getEffectiveType(reservation) : null;
  const colors = type ? getReservationTypeColor(type) : null;

  return (
    <div
      className={cn(
        "relative rounded-xl p-3 transition-all duration-300 flex flex-col gap-1.5 min-h-[110px]",
        isFree && "border-2 border-dashed border-muted-foreground/20 bg-muted/30",
        colors && `border-2 ${colors.border} ${colors.bg} shadow-lg ${colors.shadow}`,
      )}
    >
      {/* Table number badge */}
      <div className={cn(
        "absolute -top-2.5 left-3 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide",
        isFree && "bg-muted text-muted-foreground",
        colors && `${colors.badge} text-white`,
      )}>
        {table.id}
      </div>

      {/* Capacity indicator */}
      <div className="text-[10px] text-muted-foreground self-end">
        {table.capacity}p
      </div>

      {isFree ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-muted-foreground/50 font-medium">{t('tablePlan.free')}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1 flex-1">
          {/* Guest count & type */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{reservation!.guestCount}</span>
            </div>
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md",
              colors?.pill
            )}>
              <UtensilsCrossed className="h-3 w-3" />
              <span>{getReservationTypeLabel(type!)}</span>
            </div>
          </div>

          {/* Guest name or room */}
          <div className="text-xs text-foreground/80 truncate">
            {reservation!.guestName && (
              <span className="font-medium">{reservation!.guestName}</span>
            )}
            {reservation!.roomNumber && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <DoorOpen className="h-3 w-3" />
                {t('tablePlan.room')} {reservation!.roomNumber}
              </span>
            )}
          </div>

          {/* Notes badge */}
          {hasNotes && (
            <div className="flex items-start gap-1 mt-auto">
              <div className="flex items-center gap-1 text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-md leading-tight animate-pulse">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span className="line-clamp-2">{reservation!.notes}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
