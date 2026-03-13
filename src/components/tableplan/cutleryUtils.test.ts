import { describe, it, expect } from 'vitest';
import { getCutleryForType, getReservationTypeColor, getReservationTypeLabel } from './cutleryUtils';
import type { ReservationType } from './cutleryUtils';

describe('getCutleryForType', () => {
  it('returns correct cutlery for 2-ret', () => {
    const c = getCutleryForType('2-ret');
    expect(c).toEqual({ forks: 2, steakKnives: 1, butterKnives: 1, spoons: 0 });
  });

  it('returns correct cutlery for 3-ret', () => {
    const c = getCutleryForType('3-ret');
    expect(c).toEqual({ forks: 2, steakKnives: 1, butterKnives: 1, spoons: 1 });
  });

  it('returns correct cutlery for 4-ret', () => {
    const c = getCutleryForType('4-ret');
    expect(c).toEqual({ forks: 3, steakKnives: 1, butterKnives: 2, spoons: 1 });
  });

  it('treats buff same as 3-ret', () => {
    expect(getCutleryForType('buff')).toEqual(getCutleryForType('3-ret'));
  });

  it('defaults a-la-carte to 3-ret cutlery', () => {
    expect(getCutleryForType('a-la-carte')).toEqual(getCutleryForType('3-ret'));
  });

  it('defaults bordreservation to 3-ret cutlery', () => {
    expect(getCutleryForType('bordreservation')).toEqual(getCutleryForType('3-ret'));
  });
});

describe('getReservationTypeColor', () => {
  const types: ReservationType[] = ['2-ret', '3-ret', '4-ret', 'a-la-carte', 'bordreservation', 'buff', 'unavailable'];

  it('returns color object with all required keys for each type', () => {
    for (const type of types) {
      const color = getReservationTypeColor(type);
      expect(color).toHaveProperty('border');
      expect(color).toHaveProperty('bg');
      expect(color).toHaveProperty('shadow');
      expect(color).toHaveProperty('badge');
      expect(color).toHaveProperty('pill');
    }
  });

  it('returns distinct border colors for different types', () => {
    const borders = types.map(t => getReservationTypeColor(t).border);
    const unique = new Set(borders);
    expect(unique.size).toBe(types.length);
  });
});

describe('getReservationTypeLabel', () => {
  it('returns correct labels', () => {
    expect(getReservationTypeLabel('2-ret')).toBe('2-ret');
    expect(getReservationTypeLabel('3-ret')).toBe('3-ret');
    expect(getReservationTypeLabel('4-ret')).toBe('4-ret');
    expect(getReservationTypeLabel('a-la-carte')).toBe('A la carte');
    expect(getReservationTypeLabel('bordreservation')).toBe('Bordres.');
    expect(getReservationTypeLabel('buff')).toBe('BUFF');
    expect(getReservationTypeLabel('unavailable')).toBe('Utilgængelig');
  });
});
