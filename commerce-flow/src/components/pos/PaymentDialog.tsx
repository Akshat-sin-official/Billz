import { useState, useEffect } from 'react';
import { 
  Banknote, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Building2, 
  CreditCard as CreditIcon,
  Check,
  X,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCartStore } from '@/store/cartStore';
import { useInventoryStore } from '@/store/inventoryStore';
import { PaymentMethod } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (saleTotal: number) => void;
}

interface PaymentEntry {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'bank_transfer', label: 'Bank', icon: Building2 },
  { id: 'credit', label: 'Credit', icon: CreditIcon },
];

export function PaymentDialog({ isOpen, onClose, onComplete }: PaymentDialogProps) {
  const { total, customer, items, completeSale } = useCartStore();
  const { getActiveAlerts } = useInventoryStore();
  const { toast } = useToast();
  
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { id: '1', method: 'cash', amount: total }
  ]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset payments when dialog opens with new total
  useEffect(() => {
    if (isOpen) {
      setPayments([{ id: '1', method: 'cash', amount: total }]);
    }
  }, [isOpen, total]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;
  const change = totalPaid - total;

  // Check if any cart items will trigger low stock after sale
  const lowStockWarnings = items.filter(item => {
    const alerts = getActiveAlerts();
    return alerts.some(a => a.productId === item.productId);
  });

  const addPayment = () => {
    const newPayment: PaymentEntry = {
      id: Date.now().toString(),
      method: selectedMethod,
      amount: remaining > 0 ? remaining : 0,
    };
    setPayments([...payments, newPayment]);
  };

  const updatePayment = (id: string, field: keyof PaymentEntry, value: string | number) => {
    setPayments(payments.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const removePayment = (id: string) => {
    if (payments.length > 1) {
      setPayments(payments.filter(p => p.id !== id));
    }
  };

  const handleComplete = () => {
    if (totalPaid < total && !customer) {
      toast({
        title: "Insufficient Payment",
        description: "Please collect the full amount or assign a customer for credit.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const saleTotal = total;

    // Complete the sale and deduct stock
    const result = completeSale();
    
    if (!result.success) {
      toast({
        title: "Sale Failed",
        description: result.message || "Could not complete the sale.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    // Show success with change info
    toast({
      title: "Payment Successful!",
      description: `Invoice created. ${change > 0 ? `Return ₹${change.toFixed(2)} change.` : ''} Stock updated.`,
    });

    setIsProcessing(false);
    onComplete?.(saleTotal);
    onClose();
  };

  const handleQuickCash = () => {
    setPayments([{ id: '1', method: 'cash', amount: total }]);
    setTimeout(handleComplete, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payment</span>
            <span className="text-2xl font-bold text-primary">₹{total.toFixed(2)}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Low Stock Warning */}
        {lowStockWarnings.length > 0 && (
          <Alert variant="default" className="border-warning/50 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              {lowStockWarnings.length} item(s) are running low on stock. Consider restocking soon.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Payment Methods */}
          <div className="space-y-4">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(method => (
                <Button
                  key={method.id}
                  variant={selectedMethod === method.id ? "default" : "outline"}
                  className={cn(
                    "flex-col h-16 gap-1",
                    selectedMethod === method.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <method.icon className="h-5 w-5" />
                  <span className="text-xs">{method.label}</span>
                </Button>
              ))}
            </div>

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={addPayment}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Split Payment
            </Button>

            <Separator />

            <Button 
              className="w-full h-12 text-lg"
              variant="secondary"
              onClick={handleQuickCash}
              disabled={isProcessing}
            >
              <Banknote className="h-5 w-5 mr-2" />
              Quick Cash (F12)
            </Button>
          </div>

          {/* Payment Entries */}
          <div className="space-y-4">
            <Label>Payment Details</Label>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {payments.map((payment) => {
                const method = PAYMENT_METHODS.find(m => m.id === payment.method);
                return (
                  <div 
                    key={payment.id} 
                    className="p-3 border rounded-lg bg-muted/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {method && <method.icon className="h-4 w-4" />}
                        <span className="font-medium text-sm">{method?.label}</span>
                      </div>
                      {payments.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removePayment(payment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => updatePayment(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="h-8"
                      placeholder="Amount"
                    />
                    {payment.method !== 'cash' && (
                      <Input
                        value={payment.reference || ''}
                        onChange={(e) => updatePayment(payment.id, 'reference', e.target.value)}
                        className="h-8"
                        placeholder="Reference / Transaction ID"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Due</span>
                <span className="font-medium">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Paid</span>
                <span className="font-medium">₹{totalPaid.toFixed(2)}</span>
              </div>
              {remaining > 0 ? (
                <div className="flex justify-between text-destructive">
                  <span>Remaining</span>
                  <span className="font-medium">₹{remaining.toFixed(2)}</span>
                </div>
              ) : change > 0 ? (
                <div className="flex justify-between text-primary">
                  <span>Change</span>
                  <span className="font-medium">₹{change.toFixed(2)}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isProcessing}>
            <X className="h-4 w-4 mr-2" />
            Cancel (Esc)
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleComplete}
            disabled={(totalPaid < total && !customer) || isProcessing}
          >
            <Check className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Complete (F8)'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
