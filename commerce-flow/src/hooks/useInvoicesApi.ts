import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, InvoiceFilters, CreateInvoicePayload } from '@/lib/invoicesApi';
import { toast } from 'sonner';

const INVOICES_KEY = ['invoices'];
const INVOICE_STATS_KEY = ['invoices', 'stats'];

export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery({
    queryKey: [...INVOICES_KEY, filters],
    queryFn: () => invoicesApi.list(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: [...INVOICES_KEY, id],
    queryFn: () => (id ? invoicesApi.getById(id) : null),
    enabled: !!id,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: INVOICE_STATS_KEY,
    queryFn: () => invoicesApi.getStats(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => invoicesApi.create(payload),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      queryClient.invalidateQueries({ queryKey: INVOICE_STATS_KEY });
      toast.success(`Invoice ${invoice.invoiceNumber} created`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice');
    },
  });
}

export function useAddPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, payment }: { 
      invoiceId: string; 
      payment: { amount: number; method: string; reference?: string } 
    }) => invoicesApi.addPayment(invoiceId, payment as Parameters<typeof invoicesApi.addPayment>[1]),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      queryClient.invalidateQueries({ queryKey: INVOICE_STATS_KEY });
      toast.success(`Payment of ₹${invoice.paidAmount.toLocaleString()} recorded`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add payment');
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => 
      invoicesApi.cancel(id, reason),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY });
      queryClient.invalidateQueries({ queryKey: INVOICE_STATS_KEY });
      toast.success(`Invoice ${invoice.invoiceNumber} cancelled`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel invoice');
    },
  });
}

export function useSendInvoiceEmail() {
  return useMutation({
    mutationFn: ({ invoiceId, email }: { invoiceId: string; email: string }) =>
      invoicesApi.sendEmail(invoiceId, email),
    onSuccess: () => {
      toast.success('Invoice sent via email');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send email');
    },
  });
}

export function useValidateInvoiceTotals() {
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => invoicesApi.validateTotals(payload),
  });
}
