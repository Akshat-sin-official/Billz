import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Printer, FileText, Receipt, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Invoice, Customer } from '@/types';
import { InvoicePDF } from './InvoicePDF';
import { ThermalReceipt } from './ThermalReceipt';

interface InvoicePrintButtonProps {
  invoice: Invoice;
  customer?: Customer;
}

const defaultBusinessInfo = {
  name: 'BillFlow Pro Store',
  address: '123 Business Street, Commercial Area, Mumbai - 400001',
  phone: '+91 98765 43210',
  email: 'billing@billflowpro.com',
  gstNumber: '27AAAAA0000A1Z5',
};

export const InvoicePrintButton = ({ invoice, customer }: InvoicePrintButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateAndDownloadPDF = async (type: 'a4' | 'thermal-58' | 'thermal-80') => {
    setIsGenerating(true);
    try {
      let doc;
      let filename;

      switch (type) {
        case 'a4':
          doc = <InvoicePDF invoice={invoice} customer={customer} businessInfo={defaultBusinessInfo} />;
          filename = `${invoice.invoiceNumber}.pdf`;
          break;
        case 'thermal-58':
          doc = <ThermalReceipt invoice={invoice} customer={customer} businessInfo={defaultBusinessInfo} width="58mm" />;
          filename = `${invoice.invoiceNumber}-receipt-58mm.pdf`;
          break;
        case 'thermal-80':
          doc = <ThermalReceipt invoice={invoice} customer={customer} businessInfo={defaultBusinessInfo} width="80mm" />;
          filename = `${invoice.invoiceNumber}-receipt-80mm.pdf`;
          break;
      }

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF Generated',
        description: `${filename} has been downloaded`,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const printPDF = async (type: 'a4' | 'thermal-58' | 'thermal-80') => {
    setIsGenerating(true);
    try {
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
      
      // Open print dialog
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      // Cleanup after a delay
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
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Printer className="h-4 w-4 mr-2" />
          )}
          Print / Download
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Print Invoice</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => printPDF('a4')}>
          <FileText className="h-4 w-4 mr-2" />
          Print A4 Invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => printPDF('thermal-80')}>
          <Receipt className="h-4 w-4 mr-2" />
          Print Thermal (80mm)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => printPDF('thermal-58')}>
          <Receipt className="h-4 w-4 mr-2" />
          Print Thermal (58mm)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Download PDF</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => generateAndDownloadPDF('a4')}>
          <Download className="h-4 w-4 mr-2" />
          Download A4 Invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generateAndDownloadPDF('thermal-80')}>
          <Download className="h-4 w-4 mr-2" />
          Download Thermal (80mm)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generateAndDownloadPDF('thermal-58')}>
          <Download className="h-4 w-4 mr-2" />
          Download Thermal (58mm)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default InvoicePrintButton;
