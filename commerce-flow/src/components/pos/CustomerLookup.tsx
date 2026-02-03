import { useState, useEffect, useRef } from 'react';
import { Search, User, Phone, MapPin, CreditCard, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/types';
import { mockCustomers } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface CustomerLookupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

export function CustomerLookup({ isOpen, onClose, onSelect }: CustomerLookupProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCustomers = mockCustomers.filter(customer => 
    customer.name.toLowerCase().includes(query.toLowerCase()) ||
    customer.phone.includes(query) ||
    customer.email?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCustomers.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCustomers[selectedIndex]) {
          onSelect(filteredCustomers[selectedIndex]);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="bg-card border rounded-lg shadow-xl w-full max-w-lg max-h-[70vh] overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by name, phone, or email..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="overflow-y-auto max-h-[50vh]">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No customers found</p>
              <Button variant="outline" className="mt-4">
                + Add New Customer
              </Button>
            </div>
          ) : (
            filteredCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className={cn(
                  "p-4 border-b cursor-pointer transition-colors",
                  index === selectedIndex ? "bg-accent" : "hover:bg-muted/50"
                )}
                onClick={() => {
                  onSelect(customer);
                  onClose();
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{customer.name}</span>
                      {customer.loyaltyPoints > 500 && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          VIP
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </div>
                      {customer.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="flex items-center gap-1 text-primary">
                      <Star className="h-3 w-3" />
                      {customer.loyaltyPoints} pts
                    </div>
                    {customer.outstandingBalance > 0 && (
                      <div className="flex items-center gap-1 text-destructive mt-1">
                        <CreditCard className="h-3 w-3" />
                        ₹{customer.outstandingBalance.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-muted/30 border-t text-xs text-muted-foreground flex justify-between">
          <span>↑↓ Navigate • Enter Select • Esc Close</span>
          <span>{filteredCustomers.length} customers</span>
        </div>
      </div>
    </div>
  );
}
