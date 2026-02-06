import { AlertTriangle, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInventoryStore, StockAlert } from '@/store/inventoryStore';
import { cn } from '@/lib/utils';

interface StockAlertBannerProps {
  className?: string;
  maxAlerts?: number;
  compact?: boolean;
}

export function StockAlertBanner({ 
  className, 
  maxAlerts = 3,
  compact = false 
}: StockAlertBannerProps) {
  const { getActiveAlerts, dismissAlert } = useInventoryStore();
  const alerts = getActiveAlerts().slice(0, maxAlerts);

  if (alerts.length === 0) return null;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-lg",
        className
      )}>
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        <span className="text-sm text-warning font-medium">
          {alerts.length} low stock {alerts.length === 1 ? 'item' : 'items'}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {alerts.map((alert) => (
        <StockAlertItem 
          key={alert.id} 
          alert={alert} 
          onDismiss={() => dismissAlert(alert.id)} 
        />
      ))}
    </div>
  );
}

function StockAlertItem({ 
  alert, 
  onDismiss 
}: { 
  alert: StockAlert; 
  onDismiss: () => void;
}) {
  const isOutOfStock = alert.type === 'out_of_stock';
  
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border",
      isOutOfStock 
        ? "bg-destructive/5 border-destructive/30" 
        : "bg-warning/5 border-warning/30"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center",
          isOutOfStock ? "bg-destructive/10" : "bg-warning/10"
        )}>
          <Package className={cn(
            "h-4 w-4",
            isOutOfStock ? "text-destructive" : "text-warning"
          )} />
        </div>
        <div>
          <p className="text-sm font-medium">{alert.productName}</p>
          <p className="text-xs text-muted-foreground">
            {isOutOfStock ? 'Out of stock' : `Only ${alert.currentStock} left (min: ${alert.threshold})`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={cn(
            isOutOfStock 
              ? "border-destructive text-destructive" 
              : "border-warning text-warning"
          )}
        >
          {isOutOfStock ? 'Out of stock' : 'Low stock'}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
