import { useState, useEffect, useRef } from 'react';
import { Search, Barcode, Camera, AlertTriangle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { mockCategories } from '@/data/mockData';
import { useInventoryStore } from '@/store/inventoryStore';
import { cn } from '@/lib/utils';
import { BarcodeScanner } from './BarcodeScanner';

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
  isOpen: boolean;
  onClose: () => void;
  onBarcodeSearch?: (barcode: string) => void;
}

export function ProductSearch({ onProductSelect, isOpen, onClose, onBarcodeSearch }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { products, getProduct, checkLowStock } = useInventoryStore();

  const filteredProducts = products.filter(product => {
    const matchesQuery = query === '' || 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.sku.toLowerCase().includes(query.toLowerCase()) ||
      product.barcode?.includes(query);
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    
    return matchesQuery && matchesCategory && product.isActive;
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredProducts[selectedIndex]) {
          const product = filteredProducts[selectedIndex];
          if (product.stockQuantity > 0) {
            onProductSelect(product);
            setQuery('');
            onClose();
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const getCategoryColor = (categoryId?: string) => {
    const category = mockCategories.find(c => c.id === categoryId);
    return category?.color || '#6B7280';
  };

  const getCategoryName = (categoryId?: string) => {
    const category = mockCategories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorized';
  };

  const handleCameraScan = (barcode: string) => {
    setQuery(barcode);
    // Try to find product by barcode
    const product = products.find(p => p.barcode === barcode);
    if (product && product.stockQuantity > 0) {
      onProductSelect(product);
      setQuery('');
      onClose();
    }
    onBarcodeSearch?.(barcode);
  };

  const handleProductClick = (product: Product) => {
    if (product.stockQuantity > 0) {
      onProductSelect(product);
      setQuery('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="bg-card border rounded-lg shadow-xl w-full max-w-2xl max-h-[70vh] overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by name, SKU, or barcode..."
                className="pl-10 pr-10"
              />
              <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowCameraScanner(true)}
              title="Scan with camera"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Category Filters */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {mockCategories.map(category => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer"
                style={{ 
                  backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                  borderColor: category.color,
                  color: selectedCategory === category.id ? 'white' : category.color
                }}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Product List */}
        <div className="overflow-y-auto max-h-[50vh]">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No products found
            </div>
          ) : (
            filteredProducts.map((product, index) => {
              const isOutOfStock = product.stockQuantity === 0;
              const isLowStock = checkLowStock(product.id);
              
              return (
                <div
                  key={product.id}
                  className={cn(
                    "flex items-center justify-between p-3 border-b transition-colors",
                    isOutOfStock 
                      ? "bg-muted/30 cursor-not-allowed opacity-60" 
                      : "cursor-pointer hover:bg-muted/50",
                    index === selectedIndex && !isOutOfStock && "bg-accent"
                  )}
                  onClick={() => handleProductClick(product)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium", isOutOfStock && "line-through")}>
                        {product.name}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: getCategoryColor(product.categoryId), color: getCategoryColor(product.categoryId) }}
                      >
                        {getCategoryName(product.categoryId)}
                      </Badge>
                      {isOutOfStock && (
                        <Badge variant="outline" className="text-xs border-destructive text-destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Out of stock
                        </Badge>
                      )}
                      {!isOutOfStock && isLowStock && (
                        <Badge variant="outline" className="text-xs border-warning text-warning">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low stock
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                      <span>SKU: {product.sku}</span>
                      {product.barcode && <span>Barcode: {product.barcode}</span>}
                      <span className={cn(
                        isOutOfStock && 'text-destructive',
                        isLowStock && !isOutOfStock && 'text-warning'
                      )}>
                        Stock: {product.stockQuantity}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">₹{product.basePrice.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">+{product.taxRate}% tax</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-muted/30 border-t text-xs text-muted-foreground flex justify-between">
          <span>↑↓ Navigate • Enter Select • Esc Close • 📷 Camera Scan</span>
          <span>{filteredProducts.length} products</span>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      <BarcodeScanner
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScan={handleCameraScan}
      />
    </div>
  );
}
