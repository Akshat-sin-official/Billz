import { api } from '@/lib/apiClient';
import type { Invoice, InvoiceItem, InvoiceStatus, InvoiceType, Payment, PaymentMethod, Customer } from '@/types';

// Django snake_case response types
interface DjangoInvoiceItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

interface DjangoPayment {
  id: string;
  invoice_id: string;
  amount: number;
  method: string;
  reference?: string;
  created_at: string;
}

interface DjangoCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gst_number?: string;
}

interface DjangoInvoice {
  id: string;
  branch_id: string;
  customer_id?: string;
  customer?: DjangoCustomer;
  invoice_number: string;
  invoice_type: string;
  items: DjangoInvoiceItem[];
  subtotal: number;
  discount_amount: number;
  discount_type: string;
  tax_amount: number;
  total: number;
  paid_amount: number;
  status: string;
  notes?: string;
  payments: DjangoPayment[];
  created_by: string;
  created_at: string;
}

interface DjangoInvoiceStats {
  total_count: number;
  completed_count: number;
  partial_count: number;
  draft_count: number;
  cancelled_count: number;
  total_revenue: number;
  total_outstanding: number;
}

interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Mapping functions
function mapInvoiceItem(item: DjangoInvoiceItem): InvoiceItem {
  return {
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    discountAmount: item.discount_amount,
    taxRate: item.tax_rate,
    taxAmount: item.tax_amount,
    total: item.total,
  };
}

function mapPayment(payment: DjangoPayment): Payment {
  return {
    id: payment.id,
    invoiceId: payment.invoice_id,
    amount: payment.amount,
    method: payment.method as PaymentMethod,
    reference: payment.reference,
    createdAt: payment.created_at,
  };
}

function mapCustomer(customer: DjangoCustomer): Partial<Customer> {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    gstNumber: customer.gst_number,
  };
}

function mapInvoice(inv: DjangoInvoice): Invoice {
  return {
    id: inv.id,
    branchId: inv.branch_id,
    customerId: inv.customer_id,
    customer: inv.customer ? mapCustomer(inv.customer) as Customer : undefined,
    invoiceNumber: inv.invoice_number,
    invoiceType: inv.invoice_type as InvoiceType,
    items: inv.items.map(mapInvoiceItem),
    subtotal: inv.subtotal,
    discountAmount: inv.discount_amount,
    discountType: inv.discount_type as 'percentage' | 'fixed',
    taxAmount: inv.tax_amount,
    total: inv.total,
    paidAmount: inv.paid_amount,
    status: inv.status as InvoiceStatus,
    notes: inv.notes,
    payments: inv.payments.map(mapPayment),
    createdBy: inv.created_by,
    createdAt: inv.created_at,
  };
}

// Create invoice payload (frontend -> Django)
export interface CreateInvoicePayload {
  customerId?: string;
  invoiceType: InvoiceType;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
  }[];
  discountAmount?: number;
  discountType?: 'percentage' | 'fixed';
  notes?: string;
  payments?: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
  }[];
}

function toSnakeCasePayload(payload: CreateInvoicePayload) {
  return {
    customer_id: payload.customerId,
    invoice_type: payload.invoiceType,
    items: payload.items.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_amount: item.discountAmount ?? 0,
    })),
    discount_amount: payload.discountAmount ?? 0,
    discount_type: payload.discountType ?? 'fixed',
    notes: payload.notes,
    payments: payload.payments?.map(p => ({
      amount: p.amount,
      method: p.method,
      reference: p.reference,
    })),
  };
}

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus | 'all';
  invoiceType?: InvoiceType;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface InvoiceStats {
  totalCount: number;
  completedCount: number;
  partialCount: number;
  draftCount: number;
  cancelledCount: number;
  totalRevenue: number;
  totalOutstanding: number;
}

function mapStats(stats: DjangoInvoiceStats): InvoiceStats {
  return {
    totalCount: stats.total_count,
    completedCount: stats.completed_count,
    partialCount: stats.partial_count,
    draftCount: stats.draft_count,
    cancelledCount: stats.cancelled_count,
    totalRevenue: stats.total_revenue,
    totalOutstanding: stats.total_outstanding,
  };
}

export const invoicesApi = {
  async list(filters: InvoiceFilters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.invoiceType) params.append('invoice_type', filters.invoiceType);
    if (filters.customerId) params.append('customer_id', filters.customerId);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.pageSize) params.append('page_size', String(filters.pageSize));

    const query = params.toString();
    const endpoint = `/invoices/${query ? `?${query}` : ''}`;
    const response = await api.get<PaginatedResponse<DjangoInvoice>>(endpoint);
    
    return {
      invoices: response.results.map(mapInvoice),
      count: response.count,
      hasNext: !!response.next,
      hasPrevious: !!response.previous,
    };
  },

  async getById(id: string) {
    const response = await api.get<DjangoInvoice>(`/invoices/${id}/`);
    return mapInvoice(response);
  },

  async create(payload: CreateInvoicePayload) {
    // Server validates totals and calculates tax
    const response = await api.post<DjangoInvoice>('/invoices/', toSnakeCasePayload(payload));
    return mapInvoice(response);
  },

  async addPayment(invoiceId: string, payment: { amount: number; method: PaymentMethod; reference?: string }) {
    const response = await api.post<DjangoInvoice>(`/invoices/${invoiceId}/payments/`, {
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
    });
    return mapInvoice(response);
  },

  async cancel(id: string, reason?: string) {
    const response = await api.post<DjangoInvoice>(`/invoices/${id}/cancel/`, { reason });
    return mapInvoice(response);
  },

  async getStats() {
    const response = await api.get<DjangoInvoiceStats>('/invoices/stats/');
    return mapStats(response);
  },

  async sendEmail(invoiceId: string, email: string) {
    await api.post(`/invoices/${invoiceId}/send-email/`, { email });
  },

  async validateTotals(payload: CreateInvoicePayload) {
    // Server-side validation endpoint
    const response = await api.post<{
      valid: boolean;
      calculated_subtotal: number;
      calculated_tax: number;
      calculated_total: number;
      errors?: string[];
    }>('/invoices/validate/', toSnakeCasePayload(payload));
    
    return {
      valid: response.valid,
      calculatedSubtotal: response.calculated_subtotal,
      calculatedTax: response.calculated_tax,
      calculatedTotal: response.calculated_total,
      errors: response.errors,
    };
  },
};
