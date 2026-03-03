import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Users, UtensilsCrossed, DoorOpen, Unlink, Check, X, Coffee, Timer, RotateCcw, ChefHat, Wine } from 'lucide-react';
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
  coffeeOnly?: boolean;
  coffeeTeaSweet?: boolean;
  wineMenu?: boolean;
  arrivedAt?: string;
  clearedAt?: string;
  // Course tracking
  starterServedAt?: string;
  interServedAt?: string;
  mainServedAt?: string;
  dessertServedAt?: string;
}

export interface TableDef {
  id: string;
  capacity: number;
  row: number;
  col: number;
  shape?: 'round' | 'rect';
}

interface TableCardProps {
  table: TableDef;
  reservation?: Reservation;
  mergedIds?: string[];
  colSpan?: number;
  onClick?: () => void;
  onUnmerge?: () => void;
  onMarkArrived?: () => void;
  onClearTable?: () => void;
  onUndo?: () => void;
  onAdvanceCourse?: () => void;
  undoReservation?: Reservation;
  isJustAdded?: boolean;
  // Drag-and-drop
  draggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

function getEffectiveType(reservation: Reservation): ReservationType {
  if (reservation.reservationType) return reservation.reservationType;
  if (reservation.dishCount === 2) return '2-ret';
  if (reservation.dishCount === 4) return '4-ret';
  return '3-ret';
}

function stripB(id: string) {
  return id.replace('B', '');
}

function formatElapsed(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}`;
  return `0:${String(m).padStart(2, '0')}`;
}

function getElapsedMinutes(from: string): number {
  return Math.floor((Date.now() - new Date(from).getTime()) / 60000);
}

type CourseStage = 'starter' | 'inter' | 'main' | 'dessert' | 'complete';

function getCurrentCourseStage(res: Reservation): CourseStage {
  if (res.dessertServedAt) return 'complete';
  if (res.mainServedAt) return 'dessert';
  if (res.interServedAt) return 'main';
  if (res.starterServedAt) {
    const is4ret = res.reservationType === '4-ret' || res.dishCount === 4;
    return is4ret ? 'inter' : 'main';
  }
  return 'starter';
}

function getCourseLabel(stage: CourseStage): string {
  switch (stage) {
    case 'starter': return 'Kør forret';
    case 'inter': return 'Kør mellemret';
    case 'main': return 'Kør hovedret';
    case 'dessert': return 'Kør dessert';
    case 'complete': return '';
  }
}

function getLastTimestamp(res: Reservation): string | undefined {
  if (res.dessertServedAt) return res.dessertServedAt;
  if (res.mainServedAt) return res.mainServedAt;
  if (res.interServedAt) return res.interServedAt;
  if (res.starterServedAt) return res.starterServedAt;
  return res.arrivedAt;
}

// Course timing thresholds in minutes
const COURSE_THRESHOLDS: Record<string, number> = {
  starter: 15,
  inter: 10,
  main: 25,
  dessert: 15,
};

export function TableCard({
  table, reservation, mergedIds, colSpan,
  onClick, onUnmerge, onMarkArrived, onClearTable, onUndo, onAdvanceCourse, undoReservation,
  isJustAdded,
  draggable, isDragging, isDragOver,
  onDragStart, onDragOver, onDragLeave, onDrop,
}: TableCardProps) {
  const { t } = useLanguage();
  const isFree = !reservation;
  const hasNotes = reservation?.notes && reservation.notes.trim().length > 0;
  const isBuff = reservation?.reservationType === 'buff';
  const isArrived = !!reservation?.arrivedAt;

  const type = reservation ? getEffectiveType(reservation) : null;
  const colors = type ? getReservationTypeColor(type) : null;

  // Live timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!reservation?.arrivedAt) { setElapsed(0); return; }
    const lastTs = getLastTimestamp(reservation) || reservation.arrivedAt;
    const calc = () => Math.floor((Date.now() - new Date(lastTs).getTime()) / 60000);
    setElapsed(calc());
    const interval = setInterval(() => setElapsed(calc()), 30000);
    return () => clearInterval(interval);
  }, [reservation?.arrivedAt, reservation?.starterServedAt, reservation?.interServedAt, reservation?.mainServedAt, reservation?.dessertServedAt]);

  const courseStage = reservation && isArrived ? getCurrentCourseStage(reservation) : null;

  // Course timing alert: check if elapsed exceeds threshold
  const isCourseOverdue = courseStage && courseStage !== 'complete' && elapsed >= (COURSE_THRESHOLDS[courseStage] || 999);

  const displayLabel = mergedIds
    ? mergedIds.map(stripB).join('+')
    : stripB(table.id);

  const style = colSpan && colSpan > 1
    ? { gridColumn: `span ${colSpan}` }
    : undefined;

  return (
    <div
      style={style}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={cn(
        "relative p-3 transition-all duration-300 flex flex-col gap-1.5 min-h-[120px] cursor-pointer select-none",
        mergedIds ? "rounded-xl" : table.shape === 'round' ? "rounded-3xl" : "rounded-xl",
        isFree && "border-2 border-dashed border-muted-foreground/20 bg-muted/30 hover:border-muted-foreground/40",
        colors && !isBuff && `border-2 ${colors.border} ${colors.bg} shadow-lg ${colors.shadow}`,
        isBuff && colors && `border-2 border-dashed ${colors.border} ${colors.bg} shadow-lg ${colors.shadow}`,
        isDragging && "opacity-40 scale-95",
        isDragOver && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105",
        isArrived && !isCourseOverdue && "ring-1 ring-emerald-500/40",
        isCourseOverdue && "ring-2 ring-red-500/60 animate-pulse",
        isJustAdded && "table-shine",
      )}
    >
      {/* Table number badge */}
      <div className={cn(
        "absolute -top-2.5 left-3 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide",
        isFree && "bg-muted text-muted-foreground",
        colors && `${colors.badge} text-white`,
      )}>
        {displayLabel}
      </div>

      {/* Unmerge button */}
      {mergedIds && onUnmerge && (
        <button
          onClick={e => { e.stopPropagation(); onUnmerge(); }}
          className="absolute -top-2.5 right-3 p-0.5 rounded-full bg-destructive/80 text-white hover:bg-destructive transition-colors"
          title={t('tablePlan.unmerge')}
        >
          <Unlink className="h-3 w-3" />
        </button>
      )}

      {/* Capacity indicator */}
      <div className="text-[10px] text-muted-foreground self-end">
        {mergedIds ? `${mergedIds.length} tables` : `${table.capacity}p`}
      </div>

      {isFree ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground/50 font-medium">{t('tablePlan.free')}</span>
          {undoReservation && onUndo && (
            <button
              onClick={e => { e.stopPropagation(); onUndo(); }}
              className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors animate-fade-in"
              title="Undo"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Undo</span>
            </button>
          )}
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
            {(reservation!.coffeeOnly || reservation!.coffeeTeaSweet) && (
              <span title={reservation!.coffeeTeaSweet ? "Kaffe/te + sødt" : "Kaffe/te"} className="flex items-center gap-0.5 animate-pulse">
                <Coffee className="h-3.5 w-3.5 text-amber-400" />
                {reservation!.coffeeTeaSweet && (
                  <>
                    <span className="text-amber-400 text-[10px] font-bold">+</span>
                    <span className="text-amber-400 text-sm">🍪</span>
                  </>
                )}
              </span>
            )}
            {reservation!.wineMenu && (
              <span title="Vinmenu" className="flex items-center">
                <Wine className="h-3.5 w-3.5 text-purple-400" />
              </span>
            )}
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
              <div className="flex items-start gap-1.5 text-[11px] bg-destructive/15 text-destructive border border-destructive/25 px-2.5 py-1.5 rounded-lg leading-snug animate-pulse">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="line-clamp-4 font-medium">{reservation!.notes}</span>
              </div>
            </div>
          )}

          {/* Service buttons: Arrived / Course tracking / Clear */}
          <div className="flex items-center gap-1 mt-auto pt-1">
            {!isArrived && !isBuff && (
              <button
                onClick={e => { e.stopPropagation(); onMarkArrived?.(); }}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                title={t('tablePlan.arrived')}
              >
                <Check className="h-3 w-3" />
                <span>{t('tablePlan.arrived')}</span>
              </button>
            )}
            {isArrived && courseStage && courseStage !== 'complete' && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); onAdvanceCourse?.(); }}
                  className={cn(
                    "flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-colors font-medium",
                    colors ? `${colors.badge} text-white hover:opacity-80` : "bg-primary/20 text-primary hover:bg-primary/30"
                  )}
                >
                  <ChefHat className="h-3 w-3" />
                  <span>{getCourseLabel(courseStage)}</span>
                </button>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Timer className="h-3 w-3" />
                  <span className="font-mono tabular-nums">{formatElapsed(elapsed)}</span>
                </div>
              </>
            )}
            {isArrived && courseStage === 'complete' && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <Check className="h-3 w-3" />
                <Timer className="h-3 w-3" />
                <span className="font-mono tabular-nums">{formatElapsed(elapsed)}</span>
              </div>
            )}
            {isArrived && (
              <button
                onClick={e => { e.stopPropagation(); onClearTable?.(); }}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors ml-auto"
                title={t('tablePlan.clearTable')}
              >
                <X className="h-3 w-3" />
                <span>{t('tablePlan.clearTable')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
