import { useState, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/store/cartStore';
import { useSalesStore } from '@/store/salesStore';
import { cartToInvoice } from '@/lib/cartToInvoice';
import { InvoicePDF } from '@/components/invoices/InvoicePDF';
import { ThermalReceipt } from '@/components/invoices/ThermalReceipt';

const defaultBusinessInfo = {
  name: 'BillFlow Pro Store',
  address: '123 Business Street, Commercial Area, Mumbai - 400001',
  phone: '+91 98765 43210',
  email: 'billing@billflowpro.com',
  gstNumber: '27AAAAA0000A1Z5',
};

type PrintType = 'a4' | 'thermal-58' | 'thermal-80';

export function useCartPrint() {
  const { items, customer, subtotal, discountAmount, discountType, taxAmount, total } = useCartStore();
  const getNextInvoiceNumber = useSalesStore((s) => s.getNextInvoiceNumber);
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();

  const print = useCallback(
    async (type: PrintType = 'a4') => {
      if (items.length === 0) {
        toast({
          title: 'Cart Empty',
          description: 'Add items to cart before printing',
          variant: 'destructive',
        });
        return;
      }
      setIsPrinting(true);
      try {
        const cart = {
          items,
          customerId: customer?.id,
          customer,
          subtotal,
          discountAmount,
          discountType,
          taxAmount,
          total,
          couponCode: undefined,
        };
        const invoice = cartToInvoice(cart, getNextInvoiceNumber(), 'draft');

        let doc;
        switch (type) {
          case 'a4':
            doc = <InvoicePDF invoice={invoice} customer={customer} businessInfo={defaultBusinessInfo} />;
            break;
          case 'thermal-58':
            doc = <ThermalReceipt invoice={invoice} customer={customer} businessInfo={defaultBusinessInfo} width="58mm" />;
            break;
          case 'thermal-80':
            doc = <ThermalReceipt invoice={invoice} customer={customer} businessInfo={defaultBusinessInfo} width="80mm" />;
            break;
        }

        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
        setTimeout(() => URL.revokeObjectURL(url), 10000);

        toast({
          title: 'Print Dialog Opened',
          description: 'Select your printer to complete printing',
        });
      } catch (error) {
        console.error('Print error:', error);
        toast({
          title: 'Error',
          description: 'Failed to open print dialog. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsPrinting(false);
      }
    },
    [items, customer, subtotal, discountAmount, discountType, taxAmount, total, getNextInvoiceNumber, toast]
  );

  return { print, isPrinting };
}
