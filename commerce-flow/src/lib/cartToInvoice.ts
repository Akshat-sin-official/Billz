import { Cart, Invoice, InvoiceItem } from '@/types';

export function cartToInvoice(
  cart: Cart,
  invoiceNumber: string,
  status: 'draft' | 'completed' = 'draft'
): Invoice {
  const items: InvoiceItem[] = cart.items.map((item, index) => ({
    id: `item-${index + 1}`,
    productId: item.productId,
    product: item.product,
    productName: item.product.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountAmount: item.discountAmount,
    taxRate: item.taxRate,
    taxAmount: item.taxAmount,
    total: item.total,
  }));

  return {
    id: `inv-${Date.now()}`,
    branchId: 'branch-1',
    customerId: cart.customerId,
    customer: cart.customer,
    invoiceNumber,
    invoiceType: 'sale',
    items,
    subtotal: cart.subtotal,
    discountAmount: cart.discountAmount,
    discountType: cart.discountType,
    taxAmount: cart.taxAmount,
    total: cart.total,
    paidAmount: status === 'completed' ? cart.total : 0,
    status,
    payments: [],
    createdBy: '1',
    createdAt: new Date().toISOString(),
  };
}
