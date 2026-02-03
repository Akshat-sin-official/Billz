import { useRef } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Invoice } from '@/types';
import { InvoicePrintButton } from './InvoicePrintButton';

interface InvoicePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export function InvoicePreviewDialog({
  isOpen,
  onClose,
  invoice,
}: InvoicePreviewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Invoice Preview</DialogTitle>
            <InvoicePrintButton invoice={invoice} customer={invoice.customer} />
          </div>
        </DialogHeader>

        <div ref={printRef} className="bg-background p-6 rounded-lg border">
          {/* Invoice Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">BillFlow Pro</h1>
            <p className="text-sm text-muted-foreground">
              123 Business Street, City - 560001
            </p>
            <p className="text-sm text-muted-foreground">
              Phone: +91 98765 43210 | GST: 29AABCT1234D1Z5
            </p>
          </div>

          <Separator className="my-4" />

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h3 className="text-xs uppercase text-muted-foreground font-medium mb-2">
                Bill To
              </h3>
              {invoice.customer ? (
                <div className="text-sm">
                  <p className="font-medium">{invoice.customer.name}</p>
                  <p>{invoice.customer.phone}</p>
                  {invoice.customer.email && <p>{invoice.customer.email}</p>}
                  {invoice.customer.address && (
                    <p className="text-muted-foreground">{invoice.customer.address}</p>
                  )}
                  {invoice.customer.gstNumber && (
                    <p className="text-muted-foreground">GST: {invoice.customer.gstNumber}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Walk-in Customer</p>
              )}
            </div>
            <div className="text-right">
              <h3 className="text-xs uppercase text-muted-foreground font-medium mb-2">
                Invoice Details
              </h3>
              <div className="text-sm">
                <p>
                  <span className="text-muted-foreground">Invoice #:</span>{' '}
                  <span className="font-medium">{invoice.invoiceNumber}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Date:</span>{' '}
                  {format(new Date(invoice.createdAt), 'dd MMM yyyy')}
                </p>
                <p>
                  <span className="text-muted-foreground">Time:</span>{' '}
                  {format(new Date(invoice.createdAt), 'hh:mm a')}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 text-xs uppercase font-medium">#</th>
                  <th className="text-left p-3 text-xs uppercase font-medium">Item</th>
                  <th className="text-right p-3 text-xs uppercase font-medium">Qty</th>
                  <th className="text-right p-3 text-xs uppercase font-medium">Rate</th>
                  <th className="text-right p-3 text-xs uppercase font-medium">Tax</th>
                  <th className="text-right p-3 text-xs uppercase font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3 text-sm">{index + 1}</td>
                    <td className="p-3 text-sm font-medium">{item.productName}</td>
                    <td className="p-3 text-sm text-right">{item.quantity}</td>
                    <td className="p-3 text-sm text-right">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-sm text-right">{item.taxRate}%</td>
                    <td className="p-3 text-sm text-right font-medium">
                      ₹{item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end mt-6">
            <div className="w-72">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{invoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{invoice.taxAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{invoice.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="text-green-600">₹{invoice.paidAmount.toFixed(2)}</span>
                </div>
                {invoice.total - invoice.paidAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balance Due</span>
                    <span className="text-destructive font-medium">
                      ₹{(invoice.total - invoice.paidAmount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {invoice.payments.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-xs uppercase text-muted-foreground font-medium mb-2">
                Payment Details
              </h4>
              <div className="flex flex-wrap gap-4">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="text-sm">
                    <span className="text-muted-foreground capitalize">{payment.method}:</span>{' '}
                    <span className="font-medium">₹{payment.amount.toFixed(2)}</span>
                    {payment.reference && (
                      <span className="text-muted-foreground"> ({payment.reference})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
            <p>Thank you for your business!</p>
            <p className="mt-1">Terms & Conditions: Goods once sold cannot be returned.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
