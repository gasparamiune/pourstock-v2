import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { BeverageCategory } from '@/types/inventory';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useAuth } from '@/hooks/useAuth';
import { fetchProducts as apiFetchProducts, fetchLocations as apiFetchLocations, fetchStockLevels as apiFetchStockLevels, fetchStockMovements as apiFetchStockMovements } from '@/api/queries';

export type Product = Tables<'products'>;
export type Location = Tables<'locations'>;
export type StockLevel = Tables<'stock_levels'>;
export type StockMovement = Tables<'stock_movements'>;

export interface LowStockAlert {
  product: Product;
  location: Location;
  currentStock: number;
  parLevel: number;
  reorderThreshold: number;
  suggestedOrder: number;
}

export interface StockByCategory {
  [key: string]: { total: number; low: number };
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeHotelId } = useAuth();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetchProducts(activeHotelId);
      setProducts(data as Product[]);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
    setIsLoading(false);
  }, [activeHotelId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useRealtimeSubscription('products', fetchProducts);

  return { products, isLoading, error, refetch: fetchProducts };
}

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeHotelId } = useAuth();

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetchLocations(activeHotelId);
      setLocations(data as Location[]);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
    setIsLoading(false);
  }, [activeHotelId]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);
  useRealtimeSubscription('locations', fetchLocations);

  return { locations, isLoading, error, refetch: fetchLocations };
}

export function useStockLevels(locationId?: string) {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeHotelId } = useAuth();

  const fetchStockLevels = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetchStockLevels(activeHotelId, locationId);
      setStockLevels(data as StockLevel[]);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
    setIsLoading(false);
  }, [activeHotelId, locationId]);

  useEffect(() => { fetchStockLevels(); }, [fetchStockLevels]);
  useRealtimeSubscription('stock_levels', fetchStockLevels);

  return { stockLevels, isLoading, error, refetch: fetchStockLevels };
}

export function useStockMovements(limit: number = 10) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeHotelId } = useAuth();

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetchStockMovements(activeHotelId, limit);
      setMovements(data as StockMovement[]);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
    setIsLoading(false);
  }, [activeHotelId, limit]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);
  useRealtimeSubscription('stock_movements', fetchMovements);

  return { movements, isLoading, error, refetch: fetchMovements };
}

export function useDashboardData() {
  const [data, setData] = useState<{
    products: Product[];
    locations: Location[];
    stockLevels: StockLevel[];
    movements: StockMovement[];
    lowStockAlerts: LowStockAlert[];
    stockByCategory: StockByCategory;
  }>({
    products: [],
    locations: [],
    stockLevels: [],
    movements: [],
    lowStockAlerts: [],
    stockByCategory: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeHotelId } = useAuth();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [products, locations, stockLevels, movements] = await Promise.all([
        apiFetchProducts(activeHotelId),
        apiFetchLocations(activeHotelId),
        apiFetchStockLevels(activeHotelId),
        apiFetchStockMovements(activeHotelId, 10),
      ]);

      // Calculate low stock alerts
      const lowStockAlerts: LowStockAlert[] = [];
      stockLevels.forEach((sl) => {
        if (sl.on_hand <= sl.reorder_threshold) {
          const product = products.find((p) => p.id === sl.product_id);
          const location = locations.find((l) => l.id === sl.location_id);
          if (product && location) {
            lowStockAlerts.push({
              product: product as Product,
              location: location as Location,
              currentStock: sl.on_hand,
              parLevel: sl.par_level,
              reorderThreshold: sl.reorder_threshold,
              suggestedOrder: sl.par_level - sl.on_hand,
            });
          }
        }
      });

      lowStockAlerts.sort((a, b) => {
        const aRatio = a.currentStock / a.reorderThreshold;
        const bRatio = b.currentStock / b.reorderThreshold;
        return aRatio - bRatio;
      });

      const stockByCategory: StockByCategory = {};
      products.forEach((product) => {
        if (!stockByCategory[product.category]) {
          stockByCategory[product.category] = { total: 0, low: 0 };
        }
        stockByCategory[product.category].total++;
        const hasLowStock = stockLevels.some(
          (sl) => sl.product_id === product.id && sl.on_hand <= sl.reorder_threshold
        );
        if (hasLowStock) {
          stockByCategory[product.category].low++;
        }
      });

      setData({
        products: products as Product[],
        locations: locations as Location[],
        stockLevels: stockLevels as StockLevel[],
        movements: movements as StockMovement[],
        lowStockAlerts,
        stockByCategory,
      });
      setError(null);
    } catch (e: any) {
      setError('Failed to load data');
    }
    setIsLoading(false);
  }, [activeHotelId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRealtimeSubscription(['products', 'stock_levels', 'stock_movements'], fetchData);

  return { ...data, isLoading, error, refetch: fetchData };
}

export function useProductSearch(query: string) {
  const [results, setResults] = useState<{
    productId: string;
    productName: string;
    category: BeverageCategory;
    subtype: string | null;
    locations: { locationId: string; locationName: string; onHand: number }[];
  }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { activeHotelId } = useAuth();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchProducts = async () => {
      setIsLoading(true);
      const lowerQuery = query.toLowerCase();
      const [productsRes, stockLevelsRes, locationsRes] = await Promise.all([
        supabase.from('products').select('*').eq('hotel_id', activeHotelId).eq('is_active', true)
          .or(`name.ilike.%${lowerQuery}%,subtype.ilike.%${lowerQuery}%,vendor.ilike.%${lowerQuery}%`)
          .limit(8),
        supabase.from('stock_levels').select('*').eq('hotel_id', activeHotelId),
        supabase.from('locations').select('*').eq('hotel_id', activeHotelId).eq('is_active', true),
      ]);

      if (productsRes.error || stockLevelsRes.error || locationsRes.error) {
        setIsLoading(false);
        return;
      }

      const products = productsRes.data || [];
      const stockLevels = stockLevelsRes.data || [];
      const locations = locationsRes.data || [];

      const searchResults = products.map((product) => {
        const stockInLocations = stockLevels
          .filter((sl) => sl.product_id === product.id && sl.on_hand > 0)
          .map((sl) => {
            const location = locations.find((l) => l.id === sl.location_id);
            return { locationId: sl.location_id, locationName: location?.name || 'Unknown', onHand: sl.on_hand };
          });
        return {
          productId: product.id,
          productName: product.name,
          category: product.category as BeverageCategory,
          subtype: product.subtype,
          locations: stockInLocations,
        };
      });

      setResults(searchResults);
      setIsLoading(false);
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query, activeHotelId]);

  return { results, isLoading };
}

export function usePopularProducts(limit: number = 5) {
  const [products, setProducts] = useState<{
    productId: string;
    productName: string;
    category: BeverageCategory;
    subtype: string | null;
    locations: { locationId: string; locationName: string; onHand: number }[];
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeHotelId } = useAuth();

  useEffect(() => {
    const fetchPopular = async () => {
      setIsLoading(true);
      const [productsRes, stockLevelsRes, locationsRes] = await Promise.all([
        supabase.from('products').select('*').eq('hotel_id', activeHotelId).eq('is_active', true).order('name').limit(limit),
        supabase.from('stock_levels').select('*').eq('hotel_id', activeHotelId),
        supabase.from('locations').select('*').eq('hotel_id', activeHotelId).eq('is_active', true),
      ]);

      if (productsRes.error || stockLevelsRes.error || locationsRes.error) {
        setIsLoading(false);
        return;
      }

      const productsData = productsRes.data || [];
      const stockLevels = stockLevelsRes.data || [];
      const locations = locationsRes.data || [];

      const results = productsData.map((product) => {
        const stockInLocations = stockLevels
          .filter((sl) => sl.product_id === product.id && sl.on_hand > 0)
          .map((sl) => {
            const location = locations.find((l) => l.id === sl.location_id);
            return { locationId: sl.location_id, locationName: location?.name || 'Unknown', onHand: sl.on_hand };
          });
        return {
          productId: product.id,
          productName: product.name,
          category: product.category as BeverageCategory,
          subtype: product.subtype,
          locations: stockInLocations,
        };
      });

      setProducts(results);
      setIsLoading(false);
    };

    fetchPopular();
  }, [limit, activeHotelId]);

  return { products, isLoading };
}
