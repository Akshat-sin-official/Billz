import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Invoice, Customer } from '@/types';

// Register fonts for better typography
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

interface InvoicePDFProps {
  invoice: Invoice;
  customer?: Customer;
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstNumber?: string;
    logo?: string;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#0ea5e9',
    paddingBottom: 20,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  businessDetails: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    alignItems: 'flex-end',
  },
  invoiceTitleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  invoiceDate: {
    fontSize: 9,
    color: '#888',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  customerInfo: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  customerDetails: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.4,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0ea5e9',
    padding: 10,
    color: '#fff',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 10,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  col1: { width: '5%' },
  col2: { width: '35%' },
  col3: { width: '12%', textAlign: 'center' },
  col4: { width: '12%', textAlign: 'right' },
  col5: { width: '12%', textAlign: 'right' },
  col6: { width: '12%', textAlign: 'right' },
  col7: { width: '12%', textAlign: 'right' },
  summarySection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBox: {
    width: 250,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: '#888',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  paymentInfo: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 4,
  },
  paymentDetails: {
    fontSize: 9,
    color: '#666',
  },
  statusBadge: {
    fontSize: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  statusPartial: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  statusDraft: {
    backgroundColor: '#e2e8f0',
    color: '#64748b',
  },
});

const formatCurrency = (amount: number) => {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getDisplayItems = (invoice: Invoice) => {
  if (invoice.items?.length) {
    return invoice.items.map((item) => ({
      id: item.id,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      discount: item.discountAmount,
    }));
  }
  return [
    { id: '1', name: 'Wireless Mouse', quantity: 2, unitPrice: 599, taxRate: 18, discount: 0 },
    { id: '2', name: 'Mechanical Keyboard', quantity: 1, unitPrice: 2999, taxRate: 18, discount: 100 },
    { id: '3', name: 'USB-C Cable 1m', quantity: 5, unitPrice: 199, taxRate: 18, discount: 0 },
  ];
};

export const InvoicePDF = ({ invoice, customer, businessInfo }: InvoicePDFProps) => {
  const items = getDisplayItems(invoice);
  
  const getStatusStyle = () => {
    switch (invoice.status) {
      case 'completed': return styles.statusCompleted;
      case 'partial': return styles.statusPartial;
      default: return styles.statusDraft;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{businessInfo.name}</Text>
            <Text style={styles.businessDetails}>
              {businessInfo.address}{'\n'}
              Phone: {businessInfo.phone}{'\n'}
              Email: {businessInfo.email}
              {businessInfo.gstNumber && `\nGSTIN: ${businessInfo.gstNumber}`}
            </Text>
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceTitleText}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>Date: {formatDate(invoice.createdAt)}</Text>
            <View style={[styles.statusBadge, getStatusStyle()]}>
              <Text>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer?.name || 'Walk-in Customer'}</Text>
            {customer && (
              <Text style={styles.customerDetails}>
                {customer.phone && `Phone: ${customer.phone}`}
                {customer.email && `\nEmail: ${customer.email}`}
                {customer.address && `\nAddress: ${customer.address}`}
                {customer.gstNumber && `\nGSTIN: ${customer.gstNumber}`}
              </Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.col1]}>#</Text>
              <Text style={[styles.tableHeaderText, styles.col2]}>Item Description</Text>
              <Text style={[styles.tableHeaderText, styles.col3]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.col4]}>Rate</Text>
              <Text style={[styles.tableHeaderText, styles.col5]}>Tax</Text>
              <Text style={[styles.tableHeaderText, styles.col6]}>Disc</Text>
              <Text style={[styles.tableHeaderText, styles.col7]}>Amount</Text>
            </View>

            {/* Table Rows */}
            {items.map((item, index) => {
              const subtotal = item.quantity * item.unitPrice - item.discount;
              const taxAmount = (subtotal * item.taxRate) / 100;
              const total = subtotal + taxAmount;
              
              return (
                <View key={item.id} style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={styles.col1}>{index + 1}</Text>
                  <Text style={styles.col2}>{item.name}</Text>
                  <Text style={styles.col3}>{item.quantity}</Text>
                  <Text style={styles.col4}>{formatCurrency(item.unitPrice)}</Text>
                  <Text style={styles.col5}>{item.taxRate}%</Text>
                  <Text style={styles.col6}>{item.discount > 0 ? formatCurrency(item.discount) : '-'}</Text>
                  <Text style={styles.col7}>{formatCurrency(total)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Discount {invoice.discountType === 'percentage' ? `(${invoice.discountAmount}%)` : ''}
                </Text>
                <Text style={styles.summaryValue}>-{formatCurrency(invoice.discountAmount)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (GST)</Text>
              <Text style={styles.summaryValue}>{formatCurrency(invoice.taxAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        {invoice.paidAmount > 0 && (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Payment Received</Text>
            <Text style={styles.paymentDetails}>
              Amount Paid: {formatCurrency(invoice.paidAmount)}
              {invoice.total > invoice.paidAmount && `\nBalance Due: ${formatCurrency(invoice.total - invoice.paidAmount)}`}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your business!{'\n'}
            This is a computer-generated invoice. No signature required.{'\n'}
            For any queries, please contact us at {businessInfo.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
