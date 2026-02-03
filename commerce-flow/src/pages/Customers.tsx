import { useState } from 'react';
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  CreditCard,
  Star,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockCustomers } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const handleSaveCustomer = (data: any) => {
    toast({
      title: editingCustomer ? "Customer Updated" : "Customer Added",
      description: `${data.name} has been ${editingCustomer ? 'updated' : 'added'} successfully.`,
    });
    setEditingCustomer(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTier = (points: number) => {
    if (points >= 1000) return { label: 'Gold', color: 'text-amber-500' };
    if (points >= 500) return { label: 'Silver', color: 'text-slate-400' };
    return { label: 'Bronze', color: 'text-orange-600' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer relationships</p>
        </div>
        <Button onClick={() => { setEditingCustomer(null); setShowCustomerForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Customers</div>
          <div className="text-2xl font-bold">{mockCustomers.length}</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">With Outstanding</div>
          <div className="text-2xl font-bold text-amber-500">
            {mockCustomers.filter(c => c.outstandingBalance > 0).length}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Outstanding</div>
          <div className="text-2xl font-bold text-destructive">
            ₹{mockCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Loyalty Points</div>
          <div className="text-2xl font-bold text-primary">
            {mockCustomers.reduce((sum, c) => sum + c.loyaltyPoints, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map(customer => {
              const tier = getTier(customer.loyaltyPoints);
              return (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        {customer.gstNumber && (
                          <div className="text-xs text-muted-foreground">
                            GST: {customer.gstNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={tier.color}>
                      <Star className="h-3 w-3 mr-1" />
                      {tier.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{customer.creditLimit.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-medium",
                      customer.outstandingBalance > 0 && "text-destructive"
                    )}>
                      ₹{customer.outstandingBalance.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-3 w-3 text-primary" />
                      <span className="font-medium">{customer.loyaltyPoints}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <CreditCard className="h-4 w-4 mr-2" />
                          View Transactions
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CustomerFormDialog
        isOpen={showCustomerForm}
        onClose={() => { setShowCustomerForm(false); setEditingCustomer(null); }}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
      />
    </div>
  );
}
