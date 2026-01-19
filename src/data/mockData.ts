import { Product, Location, StockLevel, User, LowStockAlert, StockMovement, POSSyncStatus } from '@/types/inventory';

export const mockUser: User = {
  id: '1',
  name: 'Alex Rivera',
  email: 'alex@bar.com',
  role: 'manager',
  avatar: undefined,
};

export const mockLocations: Location[] = [
  { id: 'loc-1', name: 'Main Bar', description: 'Front bar area', isActive: true },
  { id: 'loc-2', name: 'Back Bar', description: 'Service station', isActive: true },
  { id: 'loc-3', name: 'Wine Cellar', description: 'Temperature controlled storage', isActive: true },
  { id: 'loc-4', name: 'Storage Room', description: 'Dry goods and overflow', isActive: true },
];

export const mockProducts: Product[] = [
  // Wines
  {
    id: 'wine-1',
    name: 'Château Margaux 2018',
    category: 'wine',
    subtype: 'red',
    unitType: 'count',
    containerSize: 0.75,
    containerUnit: 'L',
    costPerUnit: 185,
    vendor: 'Premium Wine Imports',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'wine-2',
    name: 'Cloudy Bay Sauvignon Blanc',
    category: 'wine',
    subtype: 'white',
    unitType: 'count',
    containerSize: 0.75,
    containerUnit: 'L',
    costPerUnit: 28,
    vendor: 'Wine Direct',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'wine-3',
    name: 'Whispering Angel Rosé',
    category: 'wine',
    subtype: 'rose',
    unitType: 'count',
    containerSize: 0.75,
    containerUnit: 'L',
    costPerUnit: 22,
    vendor: 'Wine Direct',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Beers
  {
    id: 'beer-1',
    name: 'Heineken',
    category: 'beer',
    subtype: 'bottle',
    unitType: 'count',
    containerSize: 330,
    containerUnit: 'ml',
    costPerUnit: 2.5,
    vendor: 'Beverage Distributors',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'beer-2',
    name: 'Guinness Draught',
    category: 'beer',
    subtype: 'keg',
    unitType: 'liters',
    containerSize: 20,
    containerUnit: 'L',
    costPerUnit: 145,
    vendor: 'Draft Beer Co',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'beer-3',
    name: 'Corona Extra',
    category: 'beer',
    subtype: 'bottle',
    unitType: 'count',
    containerSize: 355,
    containerUnit: 'ml',
    costPerUnit: 2.8,
    vendor: 'Beverage Distributors',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Spirits
  {
    id: 'spirit-1',
    name: 'Grey Goose Vodka',
    category: 'spirits',
    subtype: 'vodka',
    unitType: 'count',
    containerSize: 1,
    containerUnit: 'L',
    costPerUnit: 35,
    vendor: 'Spirits Wholesale',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'spirit-2',
    name: 'Hendrick\'s Gin',
    category: 'spirits',
    subtype: 'gin',
    unitType: 'count',
    containerSize: 0.7,
    containerUnit: 'L',
    costPerUnit: 32,
    vendor: 'Spirits Wholesale',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'spirit-3',
    name: 'Don Julio Blanco',
    category: 'spirits',
    subtype: 'tequila',
    unitType: 'count',
    containerSize: 0.75,
    containerUnit: 'L',
    costPerUnit: 48,
    vendor: 'Spirits Wholesale',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'spirit-4',
    name: 'Johnnie Walker Black',
    category: 'spirits',
    subtype: 'whisky',
    unitType: 'count',
    containerSize: 0.75,
    containerUnit: 'L',
    costPerUnit: 38,
    vendor: 'Spirits Wholesale',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Coffee
  {
    id: 'coffee-1',
    name: 'Lavazza Super Crema Beans',
    category: 'coffee',
    subtype: 'beans',
    unitType: 'kg',
    containerSize: 1,
    containerUnit: 'kg',
    costPerUnit: 18,
    vendor: 'Coffee Supplies Inc',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'coffee-2',
    name: 'illy Ground Espresso',
    category: 'coffee',
    subtype: 'ground',
    unitType: 'grams',
    containerSize: 250,
    containerUnit: 'g',
    costPerUnit: 12,
    vendor: 'Coffee Supplies Inc',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Sodas
  {
    id: 'soda-1',
    name: 'Coca-Cola',
    category: 'soda',
    subtype: 'bottle',
    unitType: 'count',
    containerSize: 200,
    containerUnit: 'ml',
    costPerUnit: 1.2,
    vendor: 'Beverage Distributors',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'soda-2',
    name: 'Fever Tree Tonic',
    category: 'soda',
    subtype: 'bottle',
    unitType: 'count',
    containerSize: 200,
    containerUnit: 'ml',
    costPerUnit: 2.5,
    vendor: 'Mixers Ltd',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Syrups
  {
    id: 'syrup-1',
    name: 'Monin Simple Syrup',
    category: 'syrup',
    subtype: 'simple',
    unitType: 'count',
    containerSize: 1,
    containerUnit: 'L',
    costPerUnit: 12,
    vendor: 'Bar Supplies Co',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'syrup-2',
    name: 'Monin Grenadine',
    category: 'syrup',
    subtype: 'grenadine',
    unitType: 'count',
    containerSize: 0.7,
    containerUnit: 'L',
    costPerUnit: 10,
    vendor: 'Bar Supplies Co',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockStockLevels: StockLevel[] = [
  // Main Bar
  { id: 'sl-1', productId: 'wine-1', locationId: 'loc-1', onHand: 2, parLevel: 6, reorderThreshold: 3, lastCountedAt: new Date() },
  { id: 'sl-2', productId: 'wine-2', locationId: 'loc-1', onHand: 8, parLevel: 12, reorderThreshold: 4, lastCountedAt: new Date() },
  { id: 'sl-3', productId: 'wine-3', locationId: 'loc-1', onHand: 5, parLevel: 10, reorderThreshold: 3, lastCountedAt: new Date() },
  { id: 'sl-4', productId: 'beer-1', locationId: 'loc-1', onHand: 48, parLevel: 72, reorderThreshold: 24, lastCountedAt: new Date() },
  { id: 'sl-5', productId: 'beer-2', locationId: 'loc-1', onHand: 12, parLevel: 20, reorderThreshold: 8, partialAmount: 65 },
  { id: 'sl-6', productId: 'beer-3', locationId: 'loc-1', onHand: 36, parLevel: 48, reorderThreshold: 18, lastCountedAt: new Date() },
  { id: 'sl-7', productId: 'spirit-1', locationId: 'loc-1', onHand: 3, parLevel: 5, reorderThreshold: 2, partialAmount: 40, lastCountedAt: new Date() },
  { id: 'sl-8', productId: 'spirit-2', locationId: 'loc-1', onHand: 2, parLevel: 4, reorderThreshold: 2, partialAmount: 75, lastCountedAt: new Date() },
  { id: 'sl-9', productId: 'spirit-3', locationId: 'loc-1', onHand: 1, parLevel: 3, reorderThreshold: 1, partialAmount: 25 },
  { id: 'sl-10', productId: 'spirit-4', locationId: 'loc-1', onHand: 2, parLevel: 4, reorderThreshold: 2, partialAmount: 50 },
  { id: 'sl-11', productId: 'coffee-1', locationId: 'loc-1', onHand: 2, parLevel: 5, reorderThreshold: 2, lastCountedAt: new Date() },
  { id: 'sl-12', productId: 'soda-1', locationId: 'loc-1', onHand: 24, parLevel: 48, reorderThreshold: 12, lastCountedAt: new Date() },
  { id: 'sl-13', productId: 'soda-2', locationId: 'loc-1', onHand: 18, parLevel: 36, reorderThreshold: 12, lastCountedAt: new Date() },
  { id: 'sl-14', productId: 'syrup-1', locationId: 'loc-1', onHand: 2, parLevel: 4, reorderThreshold: 2, partialAmount: 60 },
  { id: 'sl-15', productId: 'syrup-2', locationId: 'loc-1', onHand: 1, parLevel: 3, reorderThreshold: 1, partialAmount: 30 },
  // Wine Cellar
  { id: 'sl-16', productId: 'wine-1', locationId: 'loc-3', onHand: 12, parLevel: 24, reorderThreshold: 8, lastCountedAt: new Date() },
  { id: 'sl-17', productId: 'wine-2', locationId: 'loc-3', onHand: 24, parLevel: 36, reorderThreshold: 12, lastCountedAt: new Date() },
  { id: 'sl-18', productId: 'wine-3', locationId: 'loc-3', onHand: 18, parLevel: 30, reorderThreshold: 10, lastCountedAt: new Date() },
  // Storage Room
  { id: 'sl-19', productId: 'beer-1', locationId: 'loc-4', onHand: 120, parLevel: 144, reorderThreshold: 48 },
  { id: 'sl-20', productId: 'soda-1', locationId: 'loc-4', onHand: 72, parLevel: 96, reorderThreshold: 36 },
  { id: 'sl-21', productId: 'coffee-1', locationId: 'loc-4', onHand: 8, parLevel: 12, reorderThreshold: 4 },
];

export const mockRecentMovements: StockMovement[] = [
  {
    id: 'mov-1',
    productId: 'spirit-1',
    locationId: 'loc-1',
    movementType: 'pos_sale',
    quantity: -2,
    previousQuantity: 5,
    newQuantity: 3,
    userId: '1',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: 'mov-2',
    productId: 'wine-2',
    locationId: 'loc-1',
    movementType: 'receiving',
    quantity: 12,
    previousQuantity: 8,
    newQuantity: 20,
    notes: 'Weekly delivery',
    userId: '1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: 'mov-3',
    productId: 'beer-1',
    locationId: 'loc-1',
    movementType: 'transfer',
    quantity: 24,
    previousQuantity: 24,
    newQuantity: 48,
    notes: 'From storage room',
    userId: '1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
  {
    id: 'mov-4',
    productId: 'spirit-3',
    locationId: 'loc-1',
    movementType: 'breakage',
    quantity: -1,
    previousQuantity: 2,
    newQuantity: 1,
    notes: 'Dropped during service',
    userId: '1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
];

export const mockPOSSyncStatus: POSSyncStatus = {
  isConnected: true,
  lastSyncAt: new Date(Date.now() - 1000 * 60 * 5),
  pendingItems: 0,
  errors: [],
};

export function getLowStockAlerts(): LowStockAlert[] {
  const alerts: LowStockAlert[] = [];

  mockStockLevels.forEach((sl) => {
    if (sl.onHand <= sl.reorderThreshold) {
      const product = mockProducts.find((p) => p.id === sl.productId);
      const location = mockLocations.find((l) => l.id === sl.locationId);
      if (product && location) {
        alerts.push({
          product,
          location,
          currentStock: sl.onHand,
          parLevel: sl.parLevel,
          reorderThreshold: sl.reorderThreshold,
          suggestedOrder: sl.parLevel - sl.onHand,
        });
      }
    }
  });

  return alerts.sort((a, b) => {
    const aRatio = a.currentStock / a.reorderThreshold;
    const bRatio = b.currentStock / b.reorderThreshold;
    return aRatio - bRatio;
  });
}

export function getProductWithStock(productId: string, locationId: string) {
  const product = mockProducts.find((p) => p.id === productId);
  const stockLevel = mockStockLevels.find(
    (sl) => sl.productId === productId && sl.locationId === locationId
  );
  return { product, stockLevel };
}

export function getStockByCategory(locationId: string) {
  const stockByCategory: Record<string, { total: number; low: number }> = {};
  
  mockProducts.forEach((product) => {
    if (!stockByCategory[product.category]) {
      stockByCategory[product.category] = { total: 0, low: 0 };
    }
    
    const sl = mockStockLevels.find(
      (s) => s.productId === product.id && s.locationId === locationId
    );
    
    if (sl) {
      stockByCategory[product.category].total++;
      if (sl.onHand <= sl.reorderThreshold) {
        stockByCategory[product.category].low++;
      }
    }
  });
  
  return stockByCategory;
}
