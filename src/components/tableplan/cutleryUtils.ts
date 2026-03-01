export type ReservationType = '2-ret' | '3-ret' | '4-ret' | 'a-la-carte' | 'bordreservation' | 'buff';

export interface CutlerySet {
  forks: number;
  steakKnives: number;
  butterKnives: number;
  spoons: number;
}

export function getCutleryForType(type: ReservationType): CutlerySet {
  switch (type) {
    case '2-ret':
      return { forks: 2, steakKnives: 1, butterKnives: 1, spoons: 0 };
    case '3-ret':
    case 'buff': // BUFF tables prepared same as 3-ret
      return { forks: 2, steakKnives: 1, butterKnives: 1, spoons: 1 };
    case '4-ret':
      return { forks: 3, steakKnives: 1, butterKnives: 2, spoons: 1 };
    case 'a-la-carte':
    case 'bordreservation':
    default:
      // Default to 3-ret setting
      return { forks: 2, steakKnives: 1, butterKnives: 1, spoons: 1 };
  }
}

export function getReservationTypeColor(type: ReservationType) {
  switch (type) {
    case '2-ret':
      return { border: 'border-sky-500/60', bg: 'bg-gradient-to-br from-sky-500/10 to-sky-600/5', shadow: 'shadow-sky-500/10', badge: 'bg-sky-500', pill: 'bg-sky-500/20 text-sky-300' };
    case '3-ret':
      return { border: 'border-amber-500/60', bg: 'bg-gradient-to-br from-amber-500/10 to-amber-600/5', shadow: 'shadow-amber-500/10', badge: 'bg-amber-500', pill: 'bg-amber-500/20 text-amber-300' };
    case '4-ret':
      return { border: 'border-emerald-500/60', bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5', shadow: 'shadow-emerald-500/10', badge: 'bg-emerald-500', pill: 'bg-emerald-500/20 text-emerald-300' };
    case 'a-la-carte':
      return { border: 'border-violet-500/60', bg: 'bg-gradient-to-br from-violet-500/10 to-violet-600/5', shadow: 'shadow-violet-500/10', badge: 'bg-violet-500', pill: 'bg-violet-500/20 text-violet-300' };
    case 'bordreservation':
      return { border: 'border-slate-500/60', bg: 'bg-gradient-to-br from-slate-500/10 to-slate-600/5', shadow: 'shadow-slate-500/10', badge: 'bg-slate-500', pill: 'bg-slate-500/20 text-slate-300' };
    case 'buff':
      return { border: 'border-rose-500/60 border-dashed', bg: 'bg-gradient-to-br from-rose-500/10 to-rose-600/5', shadow: 'shadow-rose-500/10', badge: 'bg-rose-500', pill: 'bg-rose-500/20 text-rose-300' };
  }
}

export function getReservationTypeLabel(type: ReservationType): string {
  switch (type) {
    case '2-ret': return '2-ret';
    case '3-ret': return '3-ret';
    case '4-ret': return '4-ret';
    case 'a-la-carte': return 'A la carte';
    case 'bordreservation': return 'Bordres.';
    case 'buff': return 'BUFF';
  }
}
