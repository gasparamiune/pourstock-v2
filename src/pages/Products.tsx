import { useState, useMemo } from 'react';
import { Plus, Search, MoreVertical, Edit, Copy, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoryBadge } from '@/components/inventory/CategoryBadge';
import { mockProducts } from '@/data/mockData';
import { BeverageCategory, categoryLabels, Product } from '@/types/inventory';
import { cn } from '@/lib/utils';
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

const categories: BeverageCategory[] = ['wine', 'beer', 'spirits', 'coffee', 'soda', 'syrup'];

export default function Products() {
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

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.vendor?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesActive = showInactive || product.isActive;
      return matchesSearch && matchesCategory && matchesActive;
    });
  }, [search, selectedCategory, showInactive]);

  const handleAddProduct = () => {
    console.log('Adding product:', newProduct);
    setIsAddDialogOpen(false);
    setNewProduct({
      name: '',
      category: 'wine',
      subtype: '',
      containerSize: '',
      containerUnit: 'L',
      vendor: '',
    });
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-1">Products</h1>
          <p className="text-muted-foreground">Manage your beverage catalog</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products or vendors..."
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
          All ({mockProducts.length})
        </button>
        {categories.map((category) => {
          const count = mockProducts.filter(p => p.category === category).length;
          return (
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
              {categoryLabels[category]} ({count})
            </button>
          );
        })}
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground mb-4">
        {filteredProducts.length} products
      </p>

      {/* Product List */}
      <div className="space-y-2">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No products found</p>
          <Button variant="link" onClick={() => setIsAddDialogOpen(true)}>
            Add your first product
          </Button>
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                placeholder="e.g., Grey Goose Vodka"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
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
                        {categoryLabels[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtype">Subtype</Label>
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
                <Label htmlFor="size">Container Size</Label>
                <Input
                  id="size"
                  placeholder="e.g., 0.75"
                  value={newProduct.containerSize}
                  onChange={(e) => setNewProduct({ ...newProduct, containerSize: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
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
              <Label htmlFor="vendor">Vendor (optional)</Label>
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
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={!newProduct.name}>
              Add Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="glass-card rounded-xl p-4 flex items-center gap-4 hover:bg-card/80 transition-colors fade-in">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{product.name}</h3>
          {!product.isActive && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Inactive
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <CategoryBadge category={product.category} size="sm" />
          {product.subtype && (
            <span className="text-xs text-muted-foreground capitalize">{product.subtype}</span>
          )}
          {product.containerSize && product.containerUnit && (
            <span className="text-xs text-muted-foreground">
              • {product.containerSize}{product.containerUnit}
            </span>
          )}
        </div>
        {product.vendor && (
          <p className="text-xs text-muted-foreground mt-1">{product.vendor}</p>
        )}
      </div>
      <div className="text-right flex items-center gap-2">
        {product.costPerUnit && (
          <span className="text-sm font-medium">${product.costPerUnit.toFixed(2)}</span>
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
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
