import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { BeverageCategory } from '@/types/inventory';

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

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      setError(error.message);
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
}

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      setError(error.message);
    } else {
      setLocations(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return { locations, isLoading, error, refetch: fetchLocations };
}

export function useStockLevels(locationId?: string) {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStockLevels = useCallback(async () => {
    setIsLoading(true);
    let query = supabase.from('stock_levels').select('*');
    
    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
    } else {
      setStockLevels(data || []);
    }
    setIsLoading(false);
  }, [locationId]);

  useEffect(() => {
    fetchStockLevels();
  }, [fetchStockLevels]);

  return { stockLevels, isLoading, error, refetch: fetchStockLevels };
}

export function useStockMovements(limit: number = 10) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      setError(error.message);
    } else {
      setMovements(data || []);
    }
    setIsLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    const [productsRes, locationsRes, stockLevelsRes, movementsRes] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true).order('name'),
      supabase.from('locations').select('*').eq('is_active', true).order('name'),
      supabase.from('stock_levels').select('*'),
      supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    if (productsRes.error || locationsRes.error || stockLevelsRes.error || movementsRes.error) {
      setError('Failed to load data');
      setIsLoading(false);
      return;
    }

    const products = productsRes.data || [];
    const locations = locationsRes.data || [];
    const stockLevels = stockLevelsRes.data || [];
    const movements = movementsRes.data || [];

    // Calculate low stock alerts
    const lowStockAlerts: LowStockAlert[] = [];
    stockLevels.forEach((sl) => {
      if (sl.on_hand <= sl.reorder_threshold) {
        const product = products.find((p) => p.id === sl.product_id);
        const location = locations.find((l) => l.id === sl.location_id);
        if (product && location) {
          lowStockAlerts.push({
            product,
            location,
            currentStock: sl.on_hand,
            parLevel: sl.par_level,
            reorderThreshold: sl.reorder_threshold,
            suggestedOrder: sl.par_level - sl.on_hand,
          });
        }
      }
    });

    // Sort by urgency (lowest stock ratio first)
    lowStockAlerts.sort((a, b) => {
      const aRatio = a.currentStock / a.reorderThreshold;
      const bRatio = b.currentStock / b.reorderThreshold;
      return aRatio - bRatio;
    });

    // Calculate stock by category
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
      products,
      locations,
      stockLevels,
      movements,
      lowStockAlerts,
      stockByCategory,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchProducts = async () => {
      setIsLoading(true);
      
      const lowerQuery = query.toLowerCase();
      
      // Fetch products, stock levels, and locations in parallel
      // Note: category is an enum type and cannot use ilike, so we search name, subtype, and vendor only
      const [productsRes, stockLevelsRes, locationsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .or(`name.ilike.%${lowerQuery}%,subtype.ilike.%${lowerQuery}%,vendor.ilike.%${lowerQuery}%`)
          .limit(8),
        supabase.from('stock_levels').select('*'),
        supabase.from('locations').select('*').eq('is_active', true),
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
            return {
              locationId: sl.location_id,
              locationName: location?.name || 'Unknown',
              onHand: sl.on_hand,
            };
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
  }, [query]);

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

  useEffect(() => {
    const fetchPopular = async () => {
      setIsLoading(true);
      
      const [productsRes, stockLevelsRes, locationsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('name')
          .limit(limit),
        supabase.from('stock_levels').select('*'),
        supabase.from('locations').select('*').eq('is_active', true),
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
            return {
              locationId: sl.location_id,
              locationName: location?.name || 'Unknown',
              onHand: sl.on_hand,
            };
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
  }, [limit]);

  return { products, isLoading };
}
