import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Invoice, Customer } from '@/types';

// Register monospace font for thermal receipt look
Font.register({
  family: 'Courier',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
});

interface ThermalReceiptProps {
  invoice: Invoice;
  customer?: Customer;
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    gstNumber?: string;
  };
  width?: '58mm' | '80mm';
}

const createStyles = (width: '58mm' | '80mm') => {
  const pageWidth = width === '58mm' ? 164 : 226; // Approximate pixel widths
  const fontSize = width === '58mm' ? 7 : 8;
  const padding = width === '58mm' ? 8 : 12;

  return StyleSheet.create({
    page: {
      width: pageWidth,
      padding: padding,
      fontFamily: 'Courier',
      fontSize: fontSize,
      color: '#000',
      backgroundColor: '#fff',
    },
    header: {
      textAlign: 'center',
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#000',
      borderBottomStyle: 'dashed',
      paddingBottom: 8,
    },
    businessName: {
      fontSize: fontSize + 2,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    businessDetails: {
      fontSize: fontSize - 1,
      lineHeight: 1.3,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: '#000',
      borderBottomStyle: 'dashed',
      marginVertical: 6,
    },
    section: {
      marginBottom: 6,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    label: {
      fontSize: fontSize,
    },
    value: {
      fontSize: fontSize,
      fontWeight: 'bold',
    },
    itemRow: {
      marginBottom: 4,
    },
    itemName: {
      fontSize: fontSize,
      fontWeight: 'bold',
    },
    itemDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: fontSize - 1,
      paddingLeft: 8,
    },
    totalSection: {
      borderTopWidth: 2,
      borderTopColor: '#000',
      marginTop: 6,
      paddingTop: 6,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    grandTotal: {
      fontSize: fontSize + 2,
      fontWeight: 'bold',
      borderTopWidth: 1,
      borderTopColor: '#000',
      paddingTop: 4,
      marginTop: 4,
    },
    footer: {
      textAlign: 'center',
      marginTop: 10,
      fontSize: fontSize - 1,
      lineHeight: 1.4,
    },
    starLine: {
      textAlign: 'center',
      fontSize: fontSize,
      marginVertical: 4,
    },
  });
};

const formatCurrency = (amount: number) => {
  return `Rs.${amount.toFixed(2)}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }) + 
         ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const getDisplayItems = (invoice: Invoice) => {
  if (invoice.items?.length) {
    return invoice.items.map((item) => ({
      id: item.id,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));
  }
  return [
    { id: '1', name: 'Wireless Mouse', quantity: 2, unitPrice: 599 },
    { id: '2', name: 'Mech Keyboard', quantity: 1, unitPrice: 2999 },
    { id: '3', name: 'USB-C Cable', quantity: 5, unitPrice: 199 },
  ];
};

export const ThermalReceipt = ({ invoice, customer, businessInfo, width = '80mm' }: ThermalReceiptProps) => {
  const styles = createStyles(width);
  const items = getDisplayItems(invoice);

  const repeatChar = (char: string, count: number) => char.repeat(count);
  const starLine = width === '58mm' ? repeatChar('*', 24) : repeatChar('*', 32);
  const dashLine = width === '58mm' ? repeatChar('-', 24) : repeatChar('-', 32);

  return (
    <Document>
      <Page size={[width === '58mm' ? 164 : 226, 'auto']} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.starLine}>{starLine}</Text>
          <Text style={styles.businessName}>{businessInfo.name}</Text>
          <Text style={styles.businessDetails}>
            {businessInfo.address}{'\n'}
            Tel: {businessInfo.phone}
            {businessInfo.gstNumber && `\nGST: ${businessInfo.gstNumber}`}
          </Text>
          <Text style={styles.starLine}>{starLine}</Text>
        </View>

        {/* Invoice Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Bill No:</Text>
            <Text style={styles.value}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{formatDate(invoice.createdAt)}</Text>
          </View>
          {customer && (
            <View style={styles.row}>
              <Text style={styles.label}>Customer:</Text>
              <Text style={styles.value}>{customer.name}</Text>
            </View>
          )}
        </View>

        <Text style={styles.starLine}>{dashLine}</Text>

        {/* Items */}
        <View style={styles.section}>
          {items.map((item) => {
            const total = item.quantity * item.unitPrice;
            return (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemDetails}>
                  <Text>{item.quantity} x {formatCurrency(item.unitPrice)}</Text>
                  <Text>{formatCurrency(total)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Subtotal:</Text>
            <Text style={styles.value}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>Discount:</Text>
              <Text style={styles.value}>-{formatCurrency(invoice.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.label}>Tax (GST):</Text>
            <Text style={styles.value}>{formatCurrency(invoice.taxAmount)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>TOTAL:</Text>
            <Text>{formatCurrency(invoice.total)}</Text>
          </View>
          {invoice.paidAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>Paid:</Text>
              <Text style={styles.value}>{formatCurrency(invoice.paidAmount)}</Text>
            </View>
          )}
          {invoice.total > invoice.paidAmount && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>Balance:</Text>
              <Text style={styles.value}>{formatCurrency(invoice.total - invoice.paidAmount)}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.starLine}>{dashLine}</Text>
          <Text>Thank you for shopping!</Text>
          <Text>Please visit again</Text>
          <Text style={styles.starLine}>{starLine}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ThermalReceipt;
