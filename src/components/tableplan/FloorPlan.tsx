import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TableCard, type TableDef, type Reservation } from './TableCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Trash2, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Re-export algorithm items so existing imports from FloorPlan still work
export { TABLE_LAYOUT, ALSINGER_LAYOUT, FULL_LAYOUT, assignTablesToReservations, findLargePartyMerges } from './assignmentAlgorithm';
export type { MergeGroup, Assignments } from './assignmentAlgorithm';
import { TABLE_LAYOUT, type MergeGroup, type Assignments } from './assignmentAlgorithm';

// ---------- FLOOR PLAN COMPONENT ----------

interface FloorPlanProps {
  assignments: Assignments;
  tables?: TableDef[];
  compact?: boolean;
  onMoveReservation: (fromTableId: string, toTableId: string) => void;
  onMerge: (tableId1: string, tableId2: string) => void;
  onUnmerge: (mergeIndex: number) => void;
  onClickFreeTable: (tableId: string) => void;
  onClickOccupiedTable: (tableId: string) => void;
  onMarkArrived?: (tableId: string) => void;
  onClearTable?: (tableId: string) => void;
  onClearAll?: () => void;
  undoMap?: Map<string, Reservation>;
  onUndo?: (tableId: string) => void;
  justAddedTables?: Set<string>;
  onHoverTable?: (tableId: string) => void;
  onHoverEnd?: () => void;
  onTakeOrder?: (tableId: string, tableLabel: string) => void;
  openOrderTableIds?: Set<string>;
  onFireCourse?: (tableId: string) => void;
  wtfTableLabels?: Set<string>;
}

export function FloorPlan({
  assignments,
  tables: tablesProp,
  compact,
  onMoveReservation,
  onMerge,
  onUnmerge,
  onClickFreeTable,
  onClickOccupiedTable,
  onMarkArrived,
  onClearTable,
  onClearAll,
  undoMap,
  onUndo,
  justAddedTables,
  onHoverTable,
  onHoverEnd,
  onTakeOrder,
  openOrderTableIds,
  onFireCourse,
  wtfTableLabels,
}: FloorPlanProps) {
  const { t } = useLanguage();
  const tables = tablesProp ?? TABLE_LAYOUT;
  const { singles, merges } = assignments;
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [dragOverFireZone, setDragOverFireZone] = useState(false);

  const allReservations = [
    ...Array.from(singles.values()),
    ...merges.filter(mg => mg.reservation).map(mg => mg.reservation!),
  ];
  const totalGuests = allReservations.reduce((s, r) => s + r.guestCount, 0);
  const buffGuests = allReservations.filter(r => r.reservationType === 'buff').reduce((s, r) => s + r.guestCount, 0);
  const realGuests = totalGuests - buffGuests;
  const occupied = singles.size + merges.filter(mg => mg.reservation).length;
  const total = tables.length;
  const hasAnyOccupied = occupied > 0;

  // Build sets for merge rendering
  const mergedTableIds = new Set<string>();
  const mergeByFirstId = new Map<string, { mg: MergeGroup; index: number }>();
  merges.forEach((mg, idx) => {
    mergeByFirstId.set(mg.tables[0].id, { mg, index: idx });
    for (const t of mg.tables) mergedTableIds.add(t.id);
  });

  // Check if a table has arrived (for direct-open ordering)
  const isTableArrived = (tableId: string): boolean => {
    const res = singles.get(tableId);
    if (res?.arrivedAt) return true;
    for (const mg of merges) {
      if (mg.tables[0].id === tableId && mg.reservation?.arrivedAt) return true;
    }
    return false;
  };

  // Get table label helper
  const getTableLabel = (tableId: string): string => {
    const mg = mergeByFirstId.get(tableId);
    if (mg) return mg.mg.tables.map(t => t.id.replace(/^[BA]/, '')).join('+');
    return `Table ${tableId.replace(/^[BA]/, '')}`;
  };

  // Click handler: arrived tables open order center directly
  const handleTableClick = (tableId: string, isOccupied: boolean) => {
    if (compact && onTakeOrder) {
      // In compact/full mode, clicking always opens order center
      onTakeOrder(tableId, getTableLabel(tableId));
      return;
    }
    if (isOccupied) {
      if (isTableArrived(tableId) && onTakeOrder) {
        onTakeOrder(tableId, getTableLabel(tableId));
      } else {
        onClickOccupiedTable(tableId);
      }
    } else {
      onClickFreeTable(tableId);
    }
  };

  const handleDragStart = (tableId: string) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', tableId);
    setDragSource(tableId);
  };
  const handleDragOver = (tableId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(tableId);
  };
  const handleDragLeave = () => setDragOverTarget(null);
  const handleDrop = (tableId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromId = e.dataTransfer.getData('text/plain');
    setDragSource(null);
    setDragOverTarget(null);
    if (fromId && fromId !== tableId) {
      onMoveReservation(fromId, tableId);
    }
  };
  const handleDragEnd = () => {
    setDragSource(null);
    setDragOverTarget(null);
    setDragOverFireZone(false);
  };

  const legendItems = [
    { color: 'bg-sky-500', label: '2-ret' },
    { color: 'bg-amber-500', label: '3-ret' },
    { color: 'bg-emerald-500', label: '4-ret' },
    { color: 'bg-violet-500', label: 'A la carte' },
    { color: 'bg-slate-500', label: 'Bordres.' },
    { color: 'bg-rose-500', label: 'BUFF', dashed: true },
    { color: 'bg-muted', label: t('tablePlan.free') },
  ];

  // Build merge-between-cells data
  const minRow = Math.min(...tables.map(t => t.row));
  const maxRow = Math.max(...tables.map(t => t.row));
  const minCol = Math.min(...tables.map(t => t.col));
  const maxCol = Math.max(...tables.map(t => t.col));
  const numCols = maxCol - minCol + 1;
  const numRows = maxRow - minRow + 1;

  // In compact mode, skip merge buttons
  const mergeBetweenPairs: { row: number; leftTableId: string; rightTableId: string; col: number }[] = [];
  if (!compact) {
    for (let row = 1; row <= maxRow; row++) {
      const tablesInRow = tables.filter(t => t.row === row).sort((a, b) => a.col - b.col);
      for (let i = 0; i < tablesInRow.length - 1; i++) {
        const left = tablesInRow[i];
        const right = tablesInRow[i + 1];
        if (right.col - left.col !== 1) continue;
        if (left.shape === 'round' || right.shape === 'round') continue;

        const leftInMerge = mergedTableIds.has(left.id);
        const rightInMerge = mergedTableIds.has(right.id);

        if (leftInMerge && rightInMerge) {
          let sameGroup = false;
          for (const mg of merges) {
            const ids = mg.tables.map(t => t.id);
            if (ids.includes(left.id) && ids.includes(right.id)) { sameGroup = true; break; }
          }
          if (sameGroup) continue;
        }

        if (!leftInMerge && !rightInMerge) {
          mergeBetweenPairs.push({ row, leftTableId: left.id, rightTableId: right.id, col: left.col });
        } else if (leftInMerge && !rightInMerge) {
          for (const mg of merges) {
            const ids = mg.tables.map(t => t.id);
            if (ids.includes(left.id) && ids[ids.length - 1] === left.id && ids.length < 4) {
              mergeBetweenPairs.push({ row, leftTableId: left.id, rightTableId: right.id, col: left.col });
            }
          }
        } else if (!leftInMerge && rightInMerge) {
          for (const mg of merges) {
            const ids = mg.tables.map(t => t.id);
            if (ids.includes(right.id) && ids[0] === right.id && ids.length < 4) {
              mergeBetweenPairs.push({ row, leftTableId: left.id, rightTableId: right.id, col: left.col });
            }
          }
        }
      }
    }
  }

  // Whether a drag is happening from an arrived table
  const isDraggingArrived = dragSource && isTableArrived(dragSource);

  // ── Compact full-restaurant view ──
  if (compact) {
    // Determine sections: Bellevue (cols 1-4), Alsinger (cols 5-7)
    const bellevueTables = tables.filter(t => t.col <= 4);
    const alsingerTables = tables.filter(t => t.col >= 5);
    const hasBothSections = bellevueTables.length > 0 && alsingerTables.length > 0;

    const renderCompactGrid = (gridTables: TableDef[]) => {
      const gridMinRow = Math.min(...gridTables.map(t => t.row));
      const gridMaxRow = Math.max(...gridTables.map(t => t.row));
      const minCol = Math.min(...gridTables.map(t => t.col));
      const maxColLocal = Math.max(...gridTables.map(t => t.col));
      const cols = maxColLocal - minCol + 1;
      const rows = gridMaxRow - gridMinRow + 1;

      return (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 3.5rem)` }}>
          {Array.from({ length: rows }, (_, rowIdx) => {
            const row = gridMinRow + rowIdx;
            return Array.from({ length: cols }, (_, colIdx) => {
              const col = minCol + colIdx;
              const table = gridTables.find(t => t.row === row && t.col === col);
              if (!table) return <div key={`${row}-${col}`} className="w-14 h-14" />;
              if (mergedTableIds.has(table.id) && !mergeByFirstId.has(table.id)) return null;

              const mergeInfo = mergeByFirstId.get(table.id);
              const res = mergeInfo?.mg.reservation || singles.get(table.id);
              const isOccupied = !!res;

              return (
                <TableCard
                  key={table.id}
                  table={table}
                  reservation={res}
                  mergedIds={mergeInfo?.mg.tables.map(t => t.id)}
                  compact
                  onClick={() => handleTableClick(table.id, isOccupied)}
                  hasOpenOrder={openOrderTableIds?.has(table.id)}
                />
              );
            });
          }).flat().filter(Boolean)}
        </div>
      );
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{occupied}/{total} borde · {realGuests} gæster{buffGuests > 0 ? ` (+${buffGuests} BUFF)` : ''}</span>
        </div>
        <div className={cn("flex gap-6 items-start", hasBothSections ? "justify-center" : "")}>
          {bellevueTables.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2 text-center">Bellevue</div>
              {renderCompactGrid(bellevueTables)}
            </div>
          )}
          {hasBothSections && (
            <div className="w-px bg-border self-stretch min-h-[200px]" />
          )}
          {alsingerTables.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2 text-center">Alsinger</div>
              {renderCompactGrid(alsingerTables)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Normal (non-compact) view ──
  return (
    <div className="space-y-4">
      {/* Legend + Clear All */}
      <div className="flex flex-wrap gap-4 text-sm items-center">
        {legendItems.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              item.color,
              (item as any).dashed && "border border-dashed border-current"
            )} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-muted-foreground">
            {occupied}/{total} {t('tablePlan.tablesOccupied')} · {realGuests} {t('tablePlan.guests')}{buffGuests > 0 ? ` (+${buffGuests} BUFF)` : ''}
          </span>
          {hasAnyOccupied && onClearAll && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {t('tablePlan.clearAll')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('tablePlan.clearAll')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('tablePlan.clearAllConfirm')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t('common.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="relative grid gap-3" style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}>
        {Array.from({ length: numRows }, (_, rowIdx) => {
          const row = minRow + rowIdx;
          return Array.from({ length: numCols }, (_, colIdx) => {
            const col = minCol + colIdx;
            const table = tables.find(t => t.row === row && t.col === col);

            if (!table) {
              return <div key={`${row}-${col}`} className="min-h-[120px]" />;
            }

            // Merged table (first cell)
            const mergeInfo = mergeByFirstId.get(table.id);
            if (mergeInfo) {
              const { mg, index } = mergeInfo;
              const res = mg.reservation;
              const isOccupied = !!res;
              return (
                <TableCard
                  key={table.id}
                  table={table}
                  reservation={res || undefined}
                  mergedIds={mg.tables.map(t => t.id)}
                  colSpan={mg.colSpan}
                  onClick={() => handleTableClick(table.id, isOccupied)}
                  onUnmerge={() => onUnmerge(index)}
                  onMarkArrived={() => onMarkArrived?.(table.id)}
                  onClearTable={() => onClearTable?.(table.id)}
                  undoReservation={undoMap?.get(table.id)}
                  onUndo={() => onUndo?.(table.id)}
                  isJustAdded={justAddedTables?.has(table.id)}
                  draggable={isOccupied}
                  isDragging={dragSource === table.id}
                  isDragOver={dragOverTarget === table.id}
                  onDragStart={handleDragStart(table.id)}
                  onDragOver={handleDragOver(table.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop(table.id)}
                  onHoverStart={() => onHoverTable?.(table.id)}
                  onHoverEnd={onHoverEnd}
                  hasOpenOrder={openOrderTableIds?.has(table.id)}
                />
              );
            }

            // Skip non-first cells of merge
            if (mergedTableIds.has(table.id)) return null;

            const res = singles.get(table.id);
            const isOccupied = !!res;
            return (
              <TableCard
                key={table.id}
                table={table}
                reservation={res}
                onClick={() => handleTableClick(table.id, isOccupied)}
                onMarkArrived={() => onMarkArrived?.(table.id)}
                onClearTable={() => onClearTable?.(table.id)}
                undoReservation={undoMap?.get(table.id)}
                onUndo={() => onUndo?.(table.id)}
                isJustAdded={justAddedTables?.has(table.id)}
                draggable={isOccupied}
                isDragging={dragSource === table.id}
                isDragOver={dragOverTarget === table.id}
                onDragStart={handleDragStart(table.id)}
                onDragOver={handleDragOver(table.id)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop(table.id)}
                onHoverStart={() => onHoverTable?.(table.id)}
                onHoverEnd={onHoverEnd}
                hasOpenOrder={openOrderTableIds?.has(table.id)}
              />
            );
          });
        }).flat().filter(Boolean)}

        {/* Merge "+" buttons — positioned using grid-relative offsets */}
        {mergeBetweenPairs.map(({ leftTableId, rightTableId, row, col }) => {
          const colFraction = 100 / numCols;
          const leftEdge = (col - minCol + 1) * colFraction;
          const topFraction = 100 / numRows;
          const topCenter = (row - minRow) * topFraction + topFraction / 2;
          return (
            <button
              key={`merge-${leftTableId}-${rightTableId}`}
              onClick={() => onMerge(leftTableId, rightTableId)}
              className="absolute z-10 w-6 h-6 rounded-full bg-primary/80 text-primary-foreground flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity shadow-md hover:scale-110"
              style={{
                left: `calc(${leftEdge}% - 12px)`,
                top: `calc(${topCenter}% - 12px)`,
              }}
              title={t('tablePlan.merge')}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>

      {/* Drag-to-fire-course drop zone */}
      {isDraggingArrived && onFireCourse && (
        <div
          className={cn(
            "flex items-center justify-center gap-3 py-4 rounded-xl border-2 border-dashed transition-all duration-200",
            dragOverFireZone
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-muted-foreground/30 bg-muted/20"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOverFireZone(true); }}
          onDragLeave={() => setDragOverFireZone(false)}
          onDrop={(e) => {
            e.preventDefault();
            const fromId = e.dataTransfer.getData('text/plain');
            setDragSource(null);
            setDragOverFireZone(false);
            if (fromId) onFireCourse(fromId);
          }}
        >
          <ChefHat className={cn("h-6 w-6", dragOverFireZone ? "text-primary" : "text-muted-foreground/50")} />
          <span className={cn("text-sm font-medium", dragOverFireZone ? "text-primary" : "text-muted-foreground/50")}>
            Drop here to fire next course
          </span>
        </div>
      )}
    </div>
  );
}
