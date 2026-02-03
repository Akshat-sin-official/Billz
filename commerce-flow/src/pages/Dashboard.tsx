import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Receipt,
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockInvoices, mockCustomers } from '@/data/mockData';
import { useInventoryStore } from '@/store/inventoryStore';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const { getLowStockProducts, getOutOfStockProducts } = useInventoryStore();

  // Calculate stats
  const todaySales = mockInvoices
    .filter((inv) => new Date(inv.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalInvoices = mockInvoices.length;
  const lowStockProducts = getLowStockProducts();
  const outOfStockProducts = getOutOfStockProducts();
  const pendingPayments = mockInvoices.filter((inv) => inv.status === 'partial');

  const stats = [
    {
      title: "Today's Sales",
      value: `₹${todaySales.toLocaleString()}`,
      change: '+12.5%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Invoices',
      value: totalInvoices.toString(),
      change: '+3',
      trend: 'up',
      icon: Receipt,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Active Customers',
      value: mockCustomers.length.toString(),
      change: '+2',
      trend: 'up',
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Low Stock Items',
      value: lowStockProducts.length.toString(),
      change: lowStockProducts.length > 0 ? 'Action needed' : 'All good',
      trend: lowStockProducts.length > 0 ? 'down' : 'up',
      icon: Package,
      color: lowStockProducts.length > 0 ? 'text-warning' : 'text-success',
      bgColor: lowStockProducts.length > 0 ? 'bg-warning/10' : 'bg-success/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Good morning!</h2>
          <p className="text-muted-foreground">Here's what's happening with your business today.</p>
        </div>
        <Button onClick={() => navigate('/billing')} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs">
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-destructive" />
                )}
                <span className={stat.trend === 'up' ? 'text-success' : 'text-destructive'}>
                  {stat.change}
                </span>
                <span className="ml-1 text-muted-foreground">from yesterday</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Your latest invoices and sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockInvoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(invoice.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{invoice.total.toLocaleString()}</p>
                    <Badge
                      variant={
                        invoice.status === 'completed'
                          ? 'default'
                          : invoice.status === 'partial'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className="mt-1"
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="mt-4 w-full" onClick={() => navigate('/invoices')}>
              View all transactions
            </Button>
          </CardContent>
        </Card>

        {/* Alerts & Reminders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alerts & Reminders
            </CardTitle>
            <CardDescription>Items that need your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Low Stock Alerts */}
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                      <Package className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">Low stock alert</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-warning text-warning">
                    {product.stockQuantity} left
                  </Badge>
                </div>
              ))}

              {/* Pending Payments */}
              {pendingPayments.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                      <Clock className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">Payment pending</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-destructive text-destructive">
                    ₹{(invoice.total - invoice.paidAmount).toLocaleString()} due
                  </Badge>
                </div>
              ))}

              {lowStockProducts.length === 0 && pendingPayments.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <AlertTriangle className="mx-auto h-8 w-8 opacity-50" />
                  <p className="mt-2">No alerts at the moment</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <span className="text-lg">⌨️</span>
            </div>
            <div>
              <p className="font-medium">Keyboard Shortcuts</p>
              <p className="text-sm text-muted-foreground">
                Press <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">F2</kbd> for product search,{' '}
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">F8</kbd> to complete payment
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/billing')}>
            Open Billing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
