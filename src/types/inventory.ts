// Core inventory enums and display helpers
// All interface types are derived from Supabase — use Tables<'...'> from @/integrations/supabase/types

export type BeverageCategory = 'wine' | 'beer' | 'spirits' | 'coffee' | 'soda' | 'syrup';

export type WineType = 'red' | 'white' | 'rose' | 'dessert';
export type BeerType = 'bottle' | 'can' | 'keg';
export type CoffeeType = 'beans' | 'ground';
export type UnitType = 'count' | 'liters' | 'grams' | 'ml' | 'kg';

export type MovementType =
  | 'adjustment'
  | 'receiving'
  | 'transfer'
  | 'wastage'
  | 'breakage'
  | 'pos_sale'
  | 'count';

export type OrderStatus = 'draft' | 'sent' | 'received' | 'cancelled';

// Category display helpers
export const categoryLabels: Record<BeverageCategory, string> = {
  wine: 'Wine',
  beer: 'Beer',
  spirits: 'Spirits',
  coffee: 'Coffee',
  soda: 'Soda',
  syrup: 'Syrup',
};

export const categoryIcons: Record<BeverageCategory, string> = {
  wine: 'Wine',
  beer: 'Beer',
  spirits: 'Martini',
  coffee: 'Coffee',
  soda: 'GlassWater',
  syrup: 'Droplet',
};

// POS sync status (no DB table — UI-only)
export interface POSSyncStatus {
  isConnected: boolean;
  lastSyncAt?: Date;
  pendingItems: number;
  errors: string[];
}
