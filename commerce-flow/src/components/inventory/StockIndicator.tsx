import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface StockIndicatorProps {
  stockQuantity: number;
  lowStockThreshold: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function StockIndicator({ 
  stockQuantity, 
  lowStockThreshold, 
  showLabel = true,
  size = 'md'
}: StockIndicatorProps) {
  const isOutOfStock = stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= lowStockThreshold;
  const isInStock = stockQuantity > lowStockThreshold;

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  if (isOutOfStock) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "border-destructive text-destructive gap-1",
              size === 'sm' && "px-1.5 py-0.5"
            )}
          >
            <AlertCircle className={iconSize} />
            {showLabel && <span className={textSize}>Out of stock</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Product is out of stock. Cannot be added to cart.</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (isLowStock) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "border-warning text-warning gap-1",
              size === 'sm' && "px-1.5 py-0.5"
            )}
          >
            <AlertTriangle className={iconSize} />
            {showLabel && <span className={textSize}>{stockQuantity} left</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Low stock! Only {stockQuantity} remaining (threshold: {lowStockThreshold})</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (showLabel) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "border-primary/30 text-primary gap-1",
          size === 'sm' && "px-1.5 py-0.5"
        )}
      >
        <CheckCircle className={iconSize} />
        <span className={textSize}>{stockQuantity} in stock</span>
      </Badge>
    );
  }

  return null;
}
