import { describe, it, expect } from 'vitest';
import { assignTablesToReservations, TABLE_LAYOUT, findLargePartyMerges } from './assignmentAlgorithm';
import type { Reservation } from './TableCard';

function makeRes(overrides: Partial<Reservation> = {}): Reservation {
  return {
    time: '18:00',
    guestCount: 2,
    dishCount: 3,
    reservationType: '3-ret',
    guestName: 'Test',
    roomNumber: '101',
    notes: '',
    ...overrides,
  };
}

describe('assignTablesToReservations', () => {
  it('assigns a single 2-person reservation to a table', () => {
    const res = [makeRes({ guestCount: 2 })];
    const { singles, merges } = assignTablesToReservations(res);
    expect(singles.size).toBe(1);
    expect(merges.length).toBe(0);
    // Should be assigned to a table with capacity >= 2
    const [tableId, assigned] = [...singles.entries()][0];
    const table = TABLE_LAYOUT.find(t => t.id === tableId);
    expect(table).toBeDefined();
    expect(table!.capacity).toBeGreaterThanOrEqual(assigned.guestCount);
  });

  it('fills front zone before back zone', () => {
    // Create enough reservations to fill several tables
    const res = Array.from({ length: 5 }, (_, i) =>
      makeRes({ guestCount: 2, guestName: `Guest ${i}` })
    );
    const { singles } = assignTablesToReservations(res);
    const assignedIds = [...singles.keys()];
    
    const backZone = new Set(['B5', 'B15', 'B25', 'B6', 'B16', 'B26', 'B7', 'B17', 'B27', 'B8', 'B18', 'B28', 'B33', 'B34']);
    // With only 5 reservations, none should be in back zone
    for (const id of assignedIds) {
      expect(backZone.has(id)).toBe(false);
    }
  });

  it('assigns 4-ret reservations to luxus tables first', () => {
    const luxusTables = new Set(['B35', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8']);
    const res = [makeRes({ guestCount: 4, reservationType: '4-ret', dishCount: 4 })];
    const { singles } = assignTablesToReservations(res);
    const tableId = [...singles.keys()][0];
    expect(luxusTables.has(tableId)).toBe(true);
  });

  it('sorts 4-ret before 3-ret before others', () => {
    const res = [
      makeRes({ guestCount: 2, reservationType: '3-ret', guestName: 'Three' }),
      makeRes({ guestCount: 4, reservationType: '4-ret', guestName: 'Four' }),
      makeRes({ guestCount: 2, reservationType: 'bordreservation', guestName: 'Bord' }),
    ];
    const { singles } = assignTablesToReservations(res);
    // 4-ret should get a luxus table
    const luxusTables = new Set(['B35', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8']);
    let fourRetTable: string | null = null;
    for (const [tableId, r] of singles) {
      if (r.guestName === 'Four') fourRetTable = tableId;
    }
    expect(fourRetTable).not.toBeNull();
    expect(luxusTables.has(fourRetTable!)).toBe(true);
  });

  it('handles empty reservation list', () => {
    const { singles, merges } = assignTablesToReservations([]);
    expect(singles.size).toBe(0);
    expect(merges.length).toBe(0);
  });

  it('assigns all reservations when capacity allows', () => {
    const res = Array.from({ length: 10 }, (_, i) =>
      makeRes({ guestCount: 2, guestName: `G${i}` })
    );
    const { singles, merges } = assignTablesToReservations(res);
    const totalAssigned = singles.size + merges.length;
    expect(totalAssigned).toBe(10);
  });

  it('merges tables for groups larger than single table capacity', () => {
    const res = [makeRes({ guestCount: 7, reservationType: '3-ret' })];
    const { singles, merges } = assignTablesToReservations(res);
    // 7 guests exceeds any single non-round table (max 4), should use round (6) or merge
    const totalAssigned = singles.size + merges.length;
    expect(totalAssigned).toBe(1);
  });

  it('does not assign B37 when other tables are available', () => {
    const res = [makeRes({ guestCount: 2 })];
    const { singles } = assignTablesToReservations(res);
    expect(singles.has('B37')).toBe(false);
  });

  it('does not assign B34 early', () => {
    const res = Array.from({ length: 3 }, (_, i) =>
      makeRes({ guestCount: 2, guestName: `G${i}` })
    );
    const { singles } = assignTablesToReservations(res);
    expect(singles.has('B34')).toBe(false);
  });
});

describe('findLargePartyMerges', () => {
  it('returns null when no space available', () => {
    const allUsed = new Set(TABLE_LAYOUT.map(t => t.id));
    const result = findLargePartyMerges(12, allUsed);
    expect(result).toBeNull();
  });

  it('splits large party into multiple groups', () => {
    const result = findLargePartyMerges(12, new Set());
    expect(result).not.toBeNull();
    if (result) {
      const totalCap = result.reduce((sum, g) => sum + g.combinedCapacity, 0);
      expect(totalCap).toBeGreaterThanOrEqual(12);
    }
  });
});
