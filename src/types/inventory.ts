// Core inventory types

export type BeverageCategory = 'wine' | 'beer' | 'spirits' | 'coffee' | 'soda' | 'syrup';

export type WineType = 'red' | 'white' | 'rose' | 'dessert';
export type BeerType = 'bottle' | 'can' | 'keg';
export type CoffeeType = 'beans' | 'ground';
export type UnitType = 'count' | 'liters' | 'grams' | 'ml' | 'kg';

export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: BeverageCategory;
  subtype?: string; // wine type, beer type, etc.
  unitType: UnitType;
  containerSize?: number; // e.g., 0.75 for 750ml bottle
  containerUnit?: string; // e.g., 'L', 'ml', 'g'
  costPerUnit?: number;
  avgCost?: number;
  vendor?: string;
  barcode?: string;
  isActive: boolean;
  imageUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockLevel {
  id: string;
  productId: string;
  locationId: string;
  onHand: number;
  parLevel: number;
  reorderThreshold: number;
  partialAmount?: number; // 0-100 for partial bottles
  lastCountedAt?: Date;
  lastCountedBy?: string;
}

export type MovementType = 
  | 'adjustment' 
  | 'receiving' 
  | 'transfer' 
  | 'wastage' 
  | 'breakage' 
  | 'pos_sale' 
  | 'count';

export interface StockMovement {
  id: string;
  productId: string;
  locationId: string;
  movementType: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  notes?: string;
  userId: string;
  createdAt: Date;
}

export type OrderStatus = 'draft' | 'sent' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  vendorId?: string;
  vendorName?: string;
  status: OrderStatus;
  items: PurchaseOrderItem[];
  totalCost?: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  sentAt?: Date;
  receivedAt?: Date;
  receivedBy?: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost?: number;
  receivedQuantity?: number;
}

export interface InventorySession {
  id: string;
  locationId: string;
  status: 'active' | 'completed';
  startedAt: Date;
  completedAt?: Date;
  startedBy: string;
  completedBy?: string;
  counts: InventoryCount[];
}

export interface InventoryCount {
  productId: string;
  countedQuantity: number;
  partialAmount?: number;
  variance?: number;
  notes?: string;
  countedAt: Date;
}

export interface LowStockAlert {
  product: Product;
  location: Location;
  currentStock: number;
  parLevel: number;
  reorderThreshold: number;
  suggestedOrder: number;
}

export interface POSSyncStatus {
  isConnected: boolean;
  lastSyncAt?: Date;
  pendingItems: number;
  errors: string[];
}

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
