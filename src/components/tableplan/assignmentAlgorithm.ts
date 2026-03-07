import type { TableDef, Reservation } from './TableCard';

// ===== TABLE LAYOUT (B31↔B33 swapped) =====
export const TABLE_LAYOUT: TableDef[] = [
  // Row 1 (back of restaurant)
  { id: 'B8',  capacity: 4, row: 1, col: 1 },
  { id: 'B18', capacity: 2, row: 1, col: 2 },
  { id: 'B28', capacity: 2, row: 1, col: 3 },
  { id: 'B34', capacity: 8, row: 1, col: 4, shape: 'round' },
  // Row 2
  { id: 'B7',  capacity: 4, row: 2, col: 1 },
  { id: 'B17', capacity: 2, row: 2, col: 2 },
  { id: 'B27', capacity: 2, row: 2, col: 3 },
  // Row 3 — B33 here (swapped from B31)
  { id: 'B6',  capacity: 4, row: 3, col: 1 },
  { id: 'B16', capacity: 2, row: 3, col: 2 },
  { id: 'B26', capacity: 2, row: 3, col: 3 },
  { id: 'B33', capacity: 2, row: 3, col: 4 },
  // Row 4
  { id: 'B5',  capacity: 4, row: 4, col: 1 },
  { id: 'B15', capacity: 2, row: 4, col: 2 },
  { id: 'B25', capacity: 2, row: 4, col: 3 },
  // Row 5 (round tables)
  { id: 'B4',  capacity: 6, row: 5, col: 1, shape: 'round' },
  { id: 'B14', capacity: 6, row: 5, col: 2, shape: 'round' },
  { id: 'B32', capacity: 6, row: 5, col: 3, shape: 'round' },
  // Row 6
  { id: 'B3',  capacity: 4, row: 6, col: 1 },
  { id: 'B13', capacity: 2, row: 6, col: 2 },
  { id: 'B23', capacity: 2, row: 6, col: 3 },
  // Row 7 — B31 here (swapped from B33)
  { id: 'B2',  capacity: 4, row: 7, col: 1 },
  { id: 'B12', capacity: 2, row: 7, col: 2 },
  { id: 'B22', capacity: 2, row: 7, col: 3 },
  { id: 'B31', capacity: 2, row: 7, col: 4 },
  // Row 8
  { id: 'B1',  capacity: 4, row: 8, col: 1 },
  { id: 'B11', capacity: 2, row: 8, col: 2 },
  { id: 'B21', capacity: 2, row: 8, col: 3 },
  // Row 9 (front of restaurant)
  { id: 'B35', capacity: 4, row: 9, col: 1 },
  { id: 'B36', capacity: 2, row: 9, col: 2 },
  { id: 'B37', capacity: 2, row: 9, col: 3 },
];

// ===== ZONES =====

const FRONT_ZONE = new Set([
  'B35', 'B36', 'B1', 'B11', 'B21',
  'B2', 'B12', 'B22',
  'B3', 'B13', 'B23',
  'B4', 'B14', 'B32',
  'B31',
]);

const BACK_ZONE = new Set([
  'B5', 'B15', 'B25',
  'B6', 'B16', 'B26',
  'B7', 'B17', 'B27',
  'B8', 'B18', 'B28',
  'B33', 'B34',
]);

// B37 is in neither zone — it is a special fallback table

// Preferred fill order. B37 sits between front and back for "phase 1" use,
// but gets a massive penalty in phase 2 so it's effectively last.
const FILL_ORDER: string[] = [
  'B35', 'B36', 'B1', 'B11', 'B21',
  'B2', 'B12', 'B22',
  'B3', 'B13', 'B23',
  'B4', 'B14', 'B32',
  'B31',
  'B5', 'B15', 'B25',
  'B6', 'B16', 'B26',
  'B7', 'B17', 'B27',
  'B8', 'B18', 'B28',
  'B33',
  'B34',
  'B37', // absolute last — only when everything else is taken
];

const LUXUS_TABLES = new Set(['B35', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8']);

// ===== TYPES =====

export interface MergeGroup {
  tables: TableDef[];
  combinedCapacity: number;
  reservation: Reservation | null;
  startCol: number;
  colSpan: number;
  row: number;
}

export interface Assignments {
  singles: Map<string, Reservation>;
  merges: MergeGroup[];
}

// ===== HELPERS =====

function getResType(res: Reservation): string {
  return res.reservationType || `${res.dishCount}-ret`;
}

function isFrontZoneFull(usedTables: Set<string>): boolean {
  for (const id of FRONT_ZONE) {
    if (!usedTables.has(id)) return false;
  }
  return true;
}

function countBackZoneUsed(usedTables: Set<string>): number {
  let c = 0;
  for (const id of BACK_ZONE) {
    if (usedTables.has(id)) c++;
  }
  return c;
}

// ===== SCORING =====

function scoreTable(
  table: TableDef,
  reservation: Reservation,
  usedTables: Set<string>,
  assignedTypes: Map<string, string>,
  remaining4Ret: number,
): number {
  if (usedTables.has(table.id)) return -Infinity;
  if (table.capacity < reservation.guestCount) return -Infinity;

  let score = 0;
  const fillIdx = FILL_ORDER.indexOf(table.id);
  const resType = getResType(reservation);

  // 1. Fill order position (lower index → higher score)
  score += (FILL_ORDER.length - fillIdx) * 10;

  // 2. Adjacency bonus — horizontal neighbor that is occupied
  const hasNeighbor = TABLE_LAYOUT.some(
    o => usedTables.has(o.id) && o.row === table.row && Math.abs(o.col - table.col) === 1,
  );
  if (hasNeighbor) score += 50;

  // 3. Back-zone penalty when front is not yet full
  const frontFull = isFrontZoneFull(usedTables);
  if (BACK_ZONE.has(table.id) && !frontFull) score -= 200;

  // 4. Table 37 — ONLY used when every other table (except B34) is occupied
  if (table.id === 'B37') {
    const allOthersFull = TABLE_LAYOUT.every(
      t => t.id === 'B37' || t.id === 'B34' || usedTables.has(t.id),
    );
    if (!allOthersFull) return -Infinity;
  }

  // 5. Table 34 — near-last resort
  if (table.id === 'B34') score -= 300;

  // 6. Luxus-table preference: 4-ret gets bonus, others get penalty when 4-ret remain
  if (LUXUS_TABLES.has(table.id)) {
    if (resType === '4-ret') score += 80;
    else if (remaining4Ret > 0) score -= 80;
  }

  // 7. Type clustering — same-type horizontal neighbor
  for (const o of TABLE_LAYOUT) {
    if (!usedTables.has(o.id)) continue;
    if (o.row !== table.row || Math.abs(o.col - table.col) !== 1) continue;
    if (assignedTypes.get(o.id) === resType) {
      score += 20;
      break;
    }
  }

  // 8. Capacity fit
  const waste = table.capacity - reservation.guestCount;
  if (waste === 0) score += 15;
  else if (waste === 1) score += 5;
  else score -= waste * 2;

  return score;
}

// ===== MERGE HELPERS =====

function findMergeGroup(
  guestCount: number,
  usedTables: Set<string>,
  reservation: Reservation,
  assignedTypes: Map<string, string>,
  remaining4Ret: number,
): MergeGroup | null {
  const candidates: (MergeGroup & { score: number })[] = [];

  for (let row = 1; row <= 9; row++) {
    const tablesInRow = TABLE_LAYOUT
      .filter(t => t.row === row && !usedTables.has(t.id) && t.shape !== 'round' && t.id !== 'B34')
      .sort((a, b) => a.col - b.col);

    for (let size = 2; size <= 4; size++) {
      for (let i = 0; i <= tablesInRow.length - size; i++) {
        let adjacent = true;
        for (let j = 0; j < size - 1; j++) {
          if (tablesInRow[i + j + 1].col - tablesInRow[i + j].col !== 1) { adjacent = false; break; }
        }
        if (!adjacent) continue;

        const combo = tablesInRow.slice(i, i + size);
        const cap = combo.reduce((s, t) => s + t.capacity, 0);
        if (cap < guestCount) continue;

        // Score the merge group using the best (first) table's score
        const bestScore = Math.max(
          ...combo.map(t => scoreTable(t, reservation, usedTables, assignedTypes, remaining4Ret)),
        );

        candidates.push({
          tables: combo,
          combinedCapacity: cap,
          reservation: null,
          startCol: combo[0].col,
          colSpan: size,
          row,
          score: bestScore,
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    const capDiff = a.combinedCapacity - b.combinedCapacity;
    if (capDiff !== 0) return capDiff;
    return b.row - a.row;
  });

  const { score: _, ...best } = candidates[0];
  return best;
}

function findMergeInRow(
  guestCount: number,
  usedTables: Set<string>,
  preferredRow?: number,
): MergeGroup | null {
  const rowCandidates: MergeGroup[] = [];
  const rows = preferredRow ? [preferredRow] : Array.from({ length: 9 }, (_, i) => i + 1);

  for (const row of rows) {
    const tablesInRow = TABLE_LAYOUT
      .filter(t => t.row === row && !usedTables.has(t.id) && t.shape !== 'round' && t.id !== 'B34')
      .sort((a, b) => a.col - b.col);

    for (let size = 2; size <= Math.min(4, tablesInRow.length); size++) {
      for (let i = 0; i <= tablesInRow.length - size; i++) {
        let adjacent = true;
        for (let j = 0; j < size - 1; j++) {
          if (tablesInRow[i + j + 1].col - tablesInRow[i + j].col !== 1) { adjacent = false; break; }
        }
        if (!adjacent) continue;
        const combo = tablesInRow.slice(i, i + size);
        const cap = combo.reduce((s, t) => s + t.capacity, 0);
        if (cap >= guestCount) {
          rowCandidates.push({
            tables: combo,
            combinedCapacity: cap,
            reservation: null,
            startCol: combo[0].col,
            colSpan: size,
            row,
          });
        }
      }
    }
  }

  if (rowCandidates.length === 0) return null;
  rowCandidates.sort((a, b) => {
    const capDiff = a.combinedCapacity - b.combinedCapacity;
    if (capDiff !== 0) return capDiff;
    return b.row - a.row;
  });
  return rowCandidates[0];
}

export function findLargePartyMerges(
  guestCount: number,
  usedTables: Set<string>,
): MergeGroup[] | null {
  const numGroups = Math.ceil(guestCount / 8);
  const perGroup = Math.ceil(guestCount / numGroups);
  const groupSizes: number[] = [];
  let remaining = guestCount;
  for (let i = 0; i < numGroups; i++) {
    const size = i < numGroups - 1 ? perGroup : remaining;
    groupSizes.push(size);
    remaining -= perGroup;
  }

  for (let startRow = 1; startRow <= 9 - numGroups + 1; startRow++) {
    const tempUsed = new Set(usedTables);
    const groups: MergeGroup[] = [];
    let success = true;

    for (let g = 0; g < numGroups; g++) {
      const row = startRow + g;
      const mg = findMergeInRow(groupSizes[g], tempUsed, row);
      if (!mg) { success = false; break; }
      groups.push(mg);
      for (const t of mg.tables) tempUsed.add(t.id);
    }

    if (success) return groups;
  }

  return null;
}

// ===== POST-PROCESSING: B37 MIGRATION =====

// (postProcessB37 removed — B37 now handled purely via scoring)

// ===== MAIN ASSIGNMENT =====

export function assignTablesToReservations(reservations: Reservation[]): Assignments {
  const singles = new Map<string, Reservation>();
  const merges: MergeGroup[] = [];
  const usedTables = new Set<string>();
  const assignedTypes = new Map<string, string>();

  // Sort: 4-ret first (protect window tables), then 3-ret, then others; within type, larger groups first
  const typeOrder: Record<string, number> = {
    '4-ret': 0,
    '3-ret': 1,
    'a la carte': 2,
    'bordreservation': 3,
    'BUFF': 4,
  };
  const sorted = [...reservations].sort((a, b) => {
    const tA = typeOrder[getResType(a)] ?? 2;
    const tB = typeOrder[getResType(b)] ?? 2;
    if (tA !== tB) return tA - tB;
    return b.guestCount - a.guestCount;
  });

  let remaining4Ret = sorted.filter(r => getResType(r) === '4-ret').length;

  // (no longer needed — assignment order tracking removed)

  for (const res of sorted) {
    const gc = res.guestCount;
    const resType = getResType(res);

    // Large party (>8): split into N adjacent row-merges
    if (gc > 8) {
      const groups = findLargePartyMerges(gc, usedTables);
      if (groups) {
        const numGroups = groups.length;
        const perGroup = Math.ceil(gc / numGroups);
        let rem = gc;
        for (let gi = 0; gi < numGroups; gi++) {
          const gSize = gi < numGroups - 1 ? perGroup : rem;
          groups[gi].reservation = {
            ...res,
            guestCount: gSize,
            notes: gi > 0 ? (res.notes ? `${res.notes} (del ${gi + 1})` : `(del ${gi + 1})`) : res.notes,
          };
          for (const t of groups[gi].tables) {
            usedTables.add(t.id);
            assignedTypes.set(t.id, resType);
          }
          rem -= perGroup;
        }
        merges.push(...groups);
        if (resType === '4-ret') remaining4Ret--;
        continue;
      }
    }

    // Score all candidate single tables
    const candidates = TABLE_LAYOUT
      .map(t => ({ table: t, score: scoreTable(t, res, usedTables, assignedTypes, remaining4Ret) }))
      .filter(c => c.score > -Infinity)
      .sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
      const best = candidates[0].table;
      singles.set(best.id, res);
      usedTables.add(best.id);
      assignedTypes.set(best.id, resType);
      
      if (resType === '4-ret') remaining4Ret--;
      continue;
    }

    // Try merge
    const mg = findMergeGroup(gc, usedTables, res, assignedTypes, remaining4Ret);
    if (mg) {
      mg.reservation = res;
      merges.push(mg);
      for (const t of mg.tables) {
        usedTables.add(t.id);
        assignedTypes.set(t.id, resType);
        assignmentOrder.push(t.id);
      }
      if (resType === '4-ret') remaining4Ret--;
      continue;
    }
  }

  // Post-processing: B37 migration pass
  postProcessB37(singles, merges, usedTables, assignedTypes, assignmentOrder);

  return { singles, merges };
}
