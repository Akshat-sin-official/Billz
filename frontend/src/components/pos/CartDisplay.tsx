import { Trash2, Plus, Minus, Percent, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cartStore';
import { useInventoryStore } from '@/store/inventoryStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function CartDisplay() {
  const { items, removeItem, updateQuantity, updateItemDiscount, getAvailableStock } = useCartStore();
  const { getProduct, checkLowStock } = useInventoryStore();
  const { toast } = useToast();
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState('');

  const handleDiscountSubmit = (productId: string) => {
    const discount = parseFloat(discountValue) || 0;
    updateItemDiscount(productId, discount);
    setEditingDiscount(null);
    setDiscountValue('');
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const result = updateQuantity(productId, newQuantity);
    if (!result.success && result.message) {
      toast({
        title: "Stock Limit Reached",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg">Cart is empty</p>
          <p className="text-sm mt-1">Press F2 to search products</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-2 p-2">
        {items.map((item) => {
          const currentProduct = getProduct(item.productId);
          const availableStock = getAvailableStock(item.productId);
          const totalStock = currentProduct?.stockQuantity || 0;
          const isLowStock = currentProduct && checkLowStock(item.productId);
          const isNearLimit = availableStock <= 2 && availableStock > 0;
          
          return (
            <div
              key={item.productId}
              className={cn(
                "bg-card border rounded-lg p-3 transition-all",
                "hover:shadow-md",
                isNearLimit && "border-warning/50"
              )}
            >
              {/* Product Info Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{item.product.name}</span>
                    {isLowStock && (
                      <Badge variant="outline" className="border-warning text-warning text-xs shrink-0">
                        <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                        Low
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                    {item.discountAmount > 0 && (
                      <span className="text-destructive ml-2">
                        -₹{item.discountAmount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {/* Stock info */}
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {availableStock > 0 ? (
                      <span className={cn(isNearLimit && "text-warning")}>
                        {availableStock} more available
                      </span>
                    ) : (
                      <span className="text-destructive">Max quantity reached</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{item.total.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    Tax: ₹{item.taxAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t">
                {/* Quantity Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 0)}
                    className="w-14 h-7 text-center text-sm"
                    min={1}
                    max={totalStock}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                    disabled={availableStock <= 0}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Discount & Remove */}
                <div className="flex items-center gap-1">
                  {editingDiscount === item.productId ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder="₹ Discount"
                        className="w-20 h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleDiscountSubmit(item.productId);
                          if (e.key === 'Escape') setEditingDiscount(null);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => handleDiscountSubmit(item.productId)}
                      >
                        Apply
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingDiscount(item.productId);
                        setDiscountValue(item.discountAmount.toString());
                      }}
                    >
                      <Percent className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
