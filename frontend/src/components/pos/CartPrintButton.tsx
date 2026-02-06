import { Printer, FileText, Receipt, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCartStore } from '@/store/cartStore';
import { useCartPrint } from '@/hooks/useCartPrint';

interface CartPrintButtonProps {
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function CartPrintButton({ disabled, className, children }: CartPrintButtonProps) {
  const { items } = useCartStore();
  const { print, isPrinting } = useCartPrint();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={className}
          disabled={disabled || items.length === 0 || isPrinting}
        >
          {isPrinting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Printer className="h-4 w-4 mr-2" />
          )}
          {children ?? 'Print (Ctrl+P)'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Print Invoice</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => print('a4')}>
          <FileText className="h-4 w-4 mr-2" />
          Print A4 Invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => print('thermal-80')}>
          <Receipt className="h-4 w-4 mr-2" />
          Print Thermal (80mm)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => print('thermal-58')}>
          <Receipt className="h-4 w-4 mr-2" />
          Print Thermal (58mm)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
