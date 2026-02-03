import { useState } from 'react';
import { Percent, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCartStore } from '@/store/cartStore';

export function CartSummary() {
  const { 
    subtotal, 
    discountAmount, 
    discountType, 
    taxAmount, 
    total, 
    couponCode,
    customer,
    setDiscount,
    setCouponCode 
  } = useCartStore();

  const [showDiscount, setShowDiscount] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [tempDiscount, setTempDiscount] = useState('');
  const [tempDiscountType, setTempDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [tempCoupon, setTempCoupon] = useState('');

  const handleApplyDiscount = () => {
    const amount = parseFloat(tempDiscount) || 0;
    setDiscount(amount, tempDiscountType);
    setShowDiscount(false);
    setTempDiscount('');
  };

  const handleApplyCoupon = () => {
    setCouponCode(tempCoupon || null);
    setShowCoupon(false);
    setTempCoupon('');
  };

  const billDiscount = discountType === 'percentage' 
    ? (subtotal * discountAmount) / 100 
    : discountAmount;

  return (
    <div className="border-t bg-card p-4 space-y-3">
      {/* Customer Badge */}
      {customer && (
        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
          <User className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <div className="font-medium text-sm">{customer.name}</div>
            <div className="text-xs text-muted-foreground">{customer.phone}</div>
          </div>
          <div className="text-xs text-right">
            <div className="text-primary">{customer.loyaltyPoints} pts</div>
          </div>
        </div>
      )}

      {/* Discount Input */}
      {showDiscount && (
        <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
          <Label className="text-xs">Bill Discount</Label>
          <div className="flex gap-2">
            <Select 
              value={tempDiscountType} 
              onValueChange={(v) => setTempDiscountType(v as 'percentage' | 'fixed')}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">₹ Fixed</SelectItem>
                <SelectItem value="percentage">% Percent</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={tempDiscount}
              onChange={(e) => setTempDiscount(e.target.value)}
              placeholder="Amount"
              className="h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyDiscount();
                if (e.key === 'Escape') setShowDiscount(false);
              }}
            />
            <Button size="sm" className="h-8" onClick={handleApplyDiscount}>
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Coupon Input */}
      {showCoupon && (
        <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
          <Label className="text-xs">Coupon Code</Label>
          <div className="flex gap-2">
            <Input
              value={tempCoupon}
              onChange={(e) => setTempCoupon(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="h-8"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyCoupon();
                if (e.key === 'Escape') setShowCoupon(false);
              }}
            />
            <Button size="sm" className="h-8" onClick={handleApplyCoupon}>
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8"
          onClick={() => setShowDiscount(!showDiscount)}
        >
          <Percent className="h-3 w-3 mr-1" />
          Discount
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8"
          onClick={() => setShowCoupon(!showCoupon)}
        >
          <Tag className="h-3 w-3 mr-1" />
          Coupon
        </Button>
      </div>

      <Separator />

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        
        {billDiscount > 0 && (
          <div className="flex justify-between text-destructive">
            <span>Discount ({discountType === 'percentage' ? `${discountAmount}%` : 'Fixed'})</span>
            <span>-₹{billDiscount.toFixed(2)}</span>
          </div>
        )}

        {couponCode && (
          <div className="flex justify-between text-primary">
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {couponCode}
            </span>
            <span>Applied</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax (GST)</span>
          <span>₹{taxAmount.toFixed(2)}</span>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
