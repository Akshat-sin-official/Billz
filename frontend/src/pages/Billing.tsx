import { useState, useCallback } from 'react';
import { 
  ShoppingCart, 
  Search, 
  User, 
  Save,
  Pause,
  RotateCcw,
  Receipt,
  Camera,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { CartDisplay } from '@/components/pos/CartDisplay';
import { CartSummary } from '@/components/pos/CartSummary';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { CustomerLookup } from '@/components/pos/CustomerLookup';
import { ShortcutsHelp } from '@/components/pos/ShortcutsHelp';
import { BarcodeScanner } from '@/components/pos/BarcodeScanner';
import { CartPrintButton } from '@/components/pos/CartPrintButton';
import { useCartStore } from '@/store/cartStore';
import { useSalesStore } from '@/store/salesStore';
import { parseLooseProductBarcode, parseManualBarcode } from '@/lib/looseProductBarcode';
import { useManualLabelsStore } from '@/store/manualLabelsStore';
import { useInventoryStore } from '@/store/inventoryStore';
import { useKeyboardShortcuts, POS_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { useHardwareScanner } from '@/hooks/useHardwareScanner';
import { useCartPrint } from '@/hooks/useCartPrint';
import { useToast } from '@/hooks/use-toast';

export default function Billing() {
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  
  const { items, addItem, addManualItem, setCustomer, clearCart, total, holdCart, recallHeldCart, heldCart } = useCartStore();
  const getManualLabel = useManualLabelsStore((s) => s.getLabel);
  const { products, getLowStockProducts } = useInventoryStore();
  const { getNextInvoiceNumber, getTodaySales, getTodayInvoiceCount, recordSale } = useSalesStore();
  const { toast } = useToast();
  const { print } = useCartPrint();

  const lowStockCount = getLowStockProducts().length;

  // Handle barcode scan (from camera or hardware scanner)
  const handleBarcodeScan = useCallback((barcode: string) => {
    // Check for manual label barcode (MANUAL-{labelId})
    const manualLabelId = parseManualBarcode(barcode);
    if (manualLabelId) {
      const label = getManualLabel(manualLabelId);
      if (label) {
        addManualItem({
          name: label.productName,
          unit: label.unit,
          pricePerUnit: label.pricePerUnit,
          quantity: label.weight,
          taxRate: label.taxRate,
        });
        toast({
          title: 'Product Added',
          description: `${label.productName} (${label.weight} ${label.unit}) added to cart`,
          variant: 'default',
        });
        return;
      }
      toast({
        title: 'Label Not Found',
        description: 'This barcode label may have expired or was not found',
        variant: 'destructive',
      });
      return;
    }

    // Check for loose product barcode (LOOSE-{productId}-{weight})
    const looseData = parseLooseProductBarcode(barcode);
    if (looseData) {
      const product = products.find((p) => p.id === looseData.productId);
      if (product && product.isLoose) {
        const result = addItem(product, looseData.weight);
        if (result.success) {
          toast({
            title: 'Product Added',
            description: result.message || `${product.name} (${looseData.weight} ${product.unit}) added to cart`,
            variant: 'default',
          });
        } else {
          toast({
            title: 'Cannot Add Product',
            description: result.message || 'Product could not be added',
            variant: 'destructive',
          });
        }
        return;
      }
    }

    const product = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (product) {
      const result = addItem(product);
      if (result.success) {
        toast({
          title: 'Product Added',
          description: result.message || `${product.name} added to cart`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Cannot Add Product',
          description: result.message || 'Product could not be added',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Product Not Found',
        description: `No product found with barcode: ${barcode}`,
        variant: 'destructive',
      });
    }
  }, [addItem, toast, products]);

  // Hardware scanner support (USB/Bluetooth scanners)
  useHardwareScanner({
    onScan: handleBarcodeScan,
    enabled: !showProductSearch && !showCustomerLookup && !showPayment,
  });

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { 
      ...POS_SHORTCUTS.SEARCH_PRODUCT, 
      action: () => setShowProductSearch(true) 
    },
    { 
      ...POS_SHORTCUTS.CUSTOMER_LOOKUP, 
      action: () => setShowCustomerLookup(true) 
    },
    { 
      ...POS_SHORTCUTS.COMPLETE_PAYMENT, 
      action: () => items.length > 0 && setShowPayment(true) 
    },
    { 
      ...POS_SHORTCUTS.QUICK_CASH, 
      action: () => {
        if (items.length > 0) {
          setShowPayment(true);
        }
      }
    },
    { 
      ...POS_SHORTCUTS.NEW_INVOICE, 
      action: () => {
        clearCart();
        toast({ title: "New Invoice", description: "Cart cleared for new invoice" });
      }
    },
    { 
      ...POS_SHORTCUTS.CANCEL, 
      action: () => {
        setShowProductSearch(false);
        setShowCustomerLookup(false);
        setShowPayment(false);
      }
    },
    {
      ...POS_SHORTCUTS.HOLD_INVOICE,
      action: () => {
        if (holdCart()) {
          toast({ title: "Invoice Held", description: "Invoice saved for later" });
        }
      }
    },
    {
      ...POS_SHORTCUTS.RECALL_HELD,
      action: () => {
        if (recallHeldCart()) {
          toast({ title: "Invoice Recalled", description: "Held invoice restored" });
        } else {
          toast({ title: "No Held Invoice", description: "Nothing to recall", variant: "destructive" });
        }
      }
    },
    {
      ...POS_SHORTCUTS.PRINT_INVOICE,
      action: () => items.length > 0 && print('a4')
    },
  ]);

  const handlePaymentComplete = useCallback((saleTotal: number) => {
    recordSale(saleTotal);
    toast({
      title: "Invoice Created",
      description: "Payment processed successfully",
    });
  }, [toast, recordSale]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">New Invoice</h1>
          </div>
          <Badge variant="outline">{getNextInvoiceNumber()}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <ShortcutsHelp />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCameraScanner(true)}
            title="Scan barcode with camera"
          >
            <Camera className="h-4 w-4 mr-2" />
            Scan
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowProductSearch(true)}
          >
            <Search className="h-4 w-4 mr-2" />
            Search (F2)
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCustomerLookup(true)}
          >
            <User className="h-4 w-4 mr-2" />
            Customer (F5)
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Cart Section */}
        <div className="flex-1 flex flex-col bg-muted/30">
          <CartDisplay />
          <CartSummary />
        </div>

        {/* Action Panel */}
        <div className="w-64 border-l bg-card flex flex-col">
          <div className="p-4 flex-1 flex flex-col gap-3">
            <Button
              className="w-full h-14 text-lg"
              disabled={items.length === 0}
              onClick={() => setShowPayment(true)}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Pay ₹{total.toFixed(2)}
            </Button>

            <Separator />

            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={items.length === 0}
              onClick={() => holdCart() && toast({ title: "Invoice Held", description: "Invoice saved for later" })}
            >
              <Pause className="h-4 w-4 mr-2" />
              Hold Invoice (F9)
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={!heldCart}
              onClick={() => {
                if (recallHeldCart()) {
                  toast({ title: "Invoice Recalled", description: "Held invoice restored" });
                } else {
                  toast({ title: "No Held Invoice", description: "Nothing to recall", variant: "destructive" });
                }
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Recall Held (F10)
            </Button>

            <Separator />

            <CartPrintButton className="w-full justify-start" disabled={items.length === 0}>
              Print (Ctrl+P)
            </CartPrintButton>

            <Button
              variant="outline"
              className="w-full justify-start"
              disabled={items.length === 0}
              onClick={() => toast({ title: "Save Draft", description: "Draft save feature coming soon" })}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-t bg-muted/30">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Items in Cart</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Today's Sales</span>
                <span className="font-medium text-primary">₹{getTodaySales().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoices</span>
                <span className="font-medium">{getTodayInvoiceCount()}</span>
              </div>
              {lowStockCount > 0 && (
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-warning" />
                    Low Stock
                  </span>
                  <Badge variant="outline" className="text-xs border-warning text-warning">
                    {lowStockCount} items
                  </Badge>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t mt-2">
                <span>Scanner</span>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                  Ready
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProductSearch
        isOpen={showProductSearch}
        onClose={() => setShowProductSearch(false)}
        onProductSelect={(product) => {
          const result = addItem(product);
          if (!result.success && result.message) {
            toast({
              title: 'Cannot Add Product',
              description: result.message,
              variant: 'destructive',
            });
          } else if (result.success) {
            toast({
              title: 'Product Added',
              description: result.message || `${product.name} added to cart`,
              variant: 'default',
            });
          }
        }}
        onBarcodeSearch={handleBarcodeScan}
      />

      <CustomerLookup
        isOpen={showCustomerLookup}
        onClose={() => setShowCustomerLookup(false)}
        onSelect={(customer) => setCustomer(customer)}
      />

      <PaymentDialog
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onComplete={handlePaymentComplete}
      />

      <BarcodeScanner
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
}
