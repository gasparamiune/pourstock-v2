import { useState, useMemo, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Edit, Copy, Archive, Trash2, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoryBadge } from '@/components/inventory/CategoryBadge';
import { BeverageCategory } from '@/types/inventory';
import { cn } from '@/lib/utils';
import { getUserFriendlyError } from '@/lib/errorHandler';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tables } from '@/integrations/supabase/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Product = Tables<'products'>;

const categories: BeverageCategory[] = ['wine', 'beer', 'spirits', 'coffee', 'soda', 'syrup'];

export default function Products() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { activeHotelId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BeverageCategory | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'wine' as BeverageCategory,
    subtype: '',
    containerSize: '',
    containerUnit: 'L',
    vendor: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading products',
        description: getUserFriendlyError(error),
      });
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.vendor?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesActive = showInactive || product.is_active;
      return matchesSearch && matchesCategory && matchesActive;
    });
  }, [products, search, selectedCategory, showInactive]);

  const handleAddProduct = async () => {
    const { error } = await supabase.from('products').insert({
      name: newProduct.name,
      category: newProduct.category,
      subtype: newProduct.subtype || null,
      container_size: newProduct.containerSize ? parseFloat(newProduct.containerSize) : null,
      container_unit: newProduct.containerUnit || null,
      vendor: newProduct.vendor || null,
      is_active: true,
      hotel_id: DEFAULT_HOTEL_ID,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error adding product',
        description: getUserFriendlyError(error),
      });
    } else {
      toast({
        title: 'Product added',
        description: `${newProduct.name} has been added to the catalog.`,
      });
      setIsAddDialogOpen(false);
      setNewProduct({
        name: '',
        category: 'wine',
        subtype: '',
        containerSize: '',
        containerUnit: 'L',
        vendor: '',
      });
      fetchProducts();
    }
  };

  const getCategoryCount = (category?: BeverageCategory) => {
    if (!category) return products.filter(p => showInactive || p.is_active).length;
    return products.filter(p => p.category === category && (showInactive || p.is_active)).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">{t('products.title')}</h1>
          <p className="text-muted-foreground">{t('products.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/import')} className="gap-2">
            <Upload className="h-4 w-4" />
            {t('products.import')}
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('products.addProduct')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('products.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-0"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all touch-target",
            !selectedCategory
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {t('common.all')} ({getCategoryCount()})
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all touch-target",
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {t(`category.${category}`)} ({getCategoryCount(category)})
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground mb-4">
        {filteredProducts.length} {t('common.products')}
      </p>

      {/* Product List */}
      <div className="space-y-2">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} onRefresh={fetchProducts} t={t} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t('products.noProducts')}</p>
          <Button variant="link" onClick={() => setIsAddDialogOpen(true)}>
            {t('products.addFirst')}
          </Button>
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('products.addNew')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('products.productName')}</Label>
              <Input
                id="name"
                placeholder="e.g., Grey Goose Vodka"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('products.category')}</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value: BeverageCategory) => setNewProduct({ ...newProduct, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t(`category.${cat}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtype">{t('products.subtype')}</Label>
                <Input
                  id="subtype"
                  placeholder="e.g., vodka"
                  value={newProduct.subtype}
                  onChange={(e) => setNewProduct({ ...newProduct, subtype: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">{t('products.containerSize')}</Label>
                <Input
                  id="size"
                  placeholder="e.g., 0.75"
                  value={newProduct.containerSize}
                  onChange={(e) => setNewProduct({ ...newProduct, containerSize: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('products.unit')}</Label>
                <Select
                  value={newProduct.containerUnit}
                  onValueChange={(value) => setNewProduct({ ...newProduct, containerUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Liters (L)</SelectItem>
                    <SelectItem value="ml">Milliliters (ml)</SelectItem>
                    <SelectItem value="g">Grams (g)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">{t('products.vendor')}</Label>
              <Input
                id="vendor"
                placeholder="e.g., Premium Spirits Co"
                value={newProduct.vendor}
                onChange={(e) => setNewProduct({ ...newProduct, vendor: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddProduct} disabled={!newProduct.name}>
              {t('products.addProduct')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onRefresh: () => void;
  t: (key: string) => string;
}

function ProductCard({ product, onRefresh, t }: ProductCardProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: t('products.productDeleted'),
        description: getUserFriendlyError(error),
      });
    } else {
      toast({
        title: t('products.productDeleted'),
        description: `${product.name} ${t('products.productDeletedDesc')}`,
      });
      onRefresh();
    }
  };

  const handleArchive = async () => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: product.is_active ? t('products.productArchived') : t('products.productRestored'),
        description: getUserFriendlyError(error),
      });
    } else {
      toast({
        title: product.is_active ? t('products.productArchived') : t('products.productRestored'),
        description: `${product.name}`,
      });
      onRefresh();
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-4 hover:bg-card/80 transition-colors fade-in">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{product.name}</h3>
          {!product.is_active && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {t('common.inactive')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <CategoryBadge category={product.category} size="sm" />
          {product.subtype && (
            <span className="text-xs text-muted-foreground capitalize">{product.subtype}</span>
          )}
          {product.container_size && product.container_unit && (
            <span className="text-xs text-muted-foreground">
              • {product.container_size}{product.container_unit}
            </span>
          )}
        </div>
        {product.vendor && (
          <p className="text-xs text-muted-foreground mt-1">{product.vendor}</p>
        )}
      </div>
      <div className="text-right flex items-center gap-2">
        {product.cost_per_unit && (
          <span className="text-sm font-medium">${product.cost_per_unit.toFixed(2)}</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="touch-target">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              {t('products.duplicate')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleArchive}>
              <Archive className="h-4 w-4 mr-2" />
              {product.is_active ? t('products.archive') : t('products.restore')}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
