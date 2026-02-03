import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter,
  Eye,
  Printer,
  Mail,
  MoreHorizontal,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useInvoices, useInvoiceStats, useCancelInvoice, useSendInvoiceEmail } from '@/hooks/useInvoicesApi';
import { useDebounce } from '@/hooks/useDebounce';
import { Invoice, InvoiceStatus } from '@/types';
import { format } from 'date-fns';
import { InvoicePreviewDialog } from '@/components/invoices/InvoicePreviewDialog';
import { toast } from 'sonner';

const statusConfig: Record<InvoiceStatus, { label: string; icon: React.ElementType; className: string }> = {
  completed: { label: 'Completed', icon: CheckCircle, className: 'text-primary bg-primary/10' },
  partial: { label: 'Partial', icon: Clock, className: 'text-amber-500 bg-amber-500/10' },
  draft: { label: 'Draft', icon: FileText, className: 'text-muted-foreground bg-muted' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'text-destructive bg-destructive/10' },
};

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [cancelDialogInvoice, setCancelDialogInvoice] = useState<Invoice | null>(null);
  const [emailDialogInvoice, setEmailDialogInvoice] = useState<Invoice | null>(null);
  const [emailAddress, setEmailAddress] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: statusFilter,
  }), [debouncedSearch, statusFilter]);

  const { data, isLoading, error, refetch } = useInvoices(filters);
  const { data: stats, isLoading: statsLoading } = useInvoiceStats();
  const cancelInvoice = useCancelInvoice();
  const sendEmail = useSendInvoiceEmail();

  const invoices = data?.invoices ?? [];

  const handleCancelInvoice = () => {
    if (!cancelDialogInvoice) return;
    cancelInvoice.mutate(
      { id: cancelDialogInvoice.id },
      { onSettled: () => setCancelDialogInvoice(null) }
    );
  };

  const handleSendEmail = () => {
    if (!emailDialogInvoice || !emailAddress) return;
    sendEmail.mutate(
      { invoiceId: emailDialogInvoice.id, email: emailAddress },
      { 
        onSettled: () => {
          setEmailDialogInvoice(null);
          setEmailAddress('');
        }
      }
    );
  };

  const openEmailDialog = (invoice: Invoice) => {
    setEmailDialogInvoice(invoice);
    setEmailAddress(invoice.customer?.email || '');
  };

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load invoices</h2>
          <p className="text-muted-foreground mb-4">{(error as Error).message}</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">View and manage all invoices</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatus | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          label="Total Invoices"
          value={stats?.totalCount}
          loading={statsLoading}
        />
        <StatsCard
          label="Completed"
          value={stats?.completedCount}
          loading={statsLoading}
          className="text-primary"
        />
        <StatsCard
          label="Partial Payment"
          value={stats?.partialCount}
          loading={statsLoading}
          className="text-amber-500"
        />
        <StatsCard
          label="Total Revenue"
          value={stats?.totalRevenue}
          loading={statsLoading}
          prefix="₹"
          format
        />
      </div>

      {/* Invoices Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              invoices.map(invoice => {
                const status = statusConfig[invoice.status];
                const StatusIcon = status.icon;
                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium font-mono">{invoice.invoiceNumber}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {invoice.invoiceType}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.customer?.name || 'Walk-in Customer'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(invoice.createdAt), 'dd MMM yyyy, HH:mm')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{invoice.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={invoice.paidAmount < invoice.total ? 'text-amber-500' : ''}>
                        ₹{invoice.paidAmount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPreviewInvoice(invoice)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPreviewInvoice(invoice)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEmailDialog(invoice)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </DropdownMenuItem>
                          {invoice.status !== 'cancelled' && invoice.status !== 'completed' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setCancelDialogInvoice(invoice)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Invoice
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Preview Dialog */}
      <InvoicePreviewDialog
        isOpen={!!previewInvoice}
        onClose={() => setPreviewInvoice(null)}
        invoice={previewInvoice}
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!cancelDialogInvoice} onOpenChange={(open) => !open && setCancelDialogInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel invoice {cancelDialogInvoice?.invoiceNumber}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invoice</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvoice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelInvoice.isPending ? 'Cancelling...' : 'Cancel Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Dialog */}
      <AlertDialog open={!!emailDialogInvoice} onOpenChange={(open) => !open && setEmailDialogInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Invoice via Email</AlertDialogTitle>
            <AlertDialogDescription>
              Send invoice {emailDialogInvoice?.invoiceNumber} to the following email address:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="email"
            placeholder="customer@example.com"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendEmail}
              disabled={!emailAddress || sendEmail.isPending}
            >
              {sendEmail.isPending ? 'Sending...' : 'Send Email'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Stats card component
function StatsCard({ 
  label, 
  value, 
  loading, 
  className, 
  prefix = '',
  format = false,
}: { 
  label: string; 
  value?: number; 
  loading?: boolean; 
  className?: string;
  prefix?: string;
  format?: boolean;
}) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      {loading ? (
        <Skeleton className="h-8 w-20 mt-1" />
      ) : (
        <div className={`text-2xl font-bold ${className || ''}`}>
          {prefix}{format ? (value ?? 0).toLocaleString() : value ?? 0}
        </div>
      )}
    </div>
  );
}
