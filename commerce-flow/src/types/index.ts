// User & Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  branchId?: string;
  avatar?: string;
  isActive: boolean;
  businessName?: string;
  createdAt: string;
}

export type UserRole = 'super_admin' | 'owner' | 'manager' | 'cashier' | 'auditor';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Organization & Branch Types
export interface Organization {
  id: string;
  name: string;
  logo?: string;
  currency: string;
  taxCountry: TaxCountry;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  address?: string;
  phone?: string;
  invoicePrefix: string;
  isActive: boolean;
}

export type TaxCountry = 'india' | 'usa' | 'uk' | 'uae' | 'singapore' | 'other';

// Product Types
export interface Product {
  id: string;
  organizationId: string;
  categoryId?: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  hsnCode?: string;
  unit: string;
  basePrice: number;
  /** If true, product is sold by weight (e.g. rice, sugar) and needs barcode labels */
  isLoose?: boolean;
  wholesalePrice?: number;
  costPrice?: number;
  taxRate: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  organizationId: string;
  name: string;
  parentId?: string;
  color?: string;
}

// Customer Types
export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  creditLimit: number;
  outstandingBalance: number;
  loyaltyPoints: number;
  createdAt: string;
}

// Invoice Types
export interface Invoice {
  id: string;
  branchId: string;
  customerId?: string;
  customer?: Customer;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  taxAmount: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string;
  payments: Payment[];
  createdBy: string;
  createdAt: string;
}

export type InvoiceType = 'sale' | 'return' | 'quotation';
export type InvoiceStatus = 'draft' | 'completed' | 'partial' | 'cancelled';

export interface InvoiceItem {
  id: string;
  productId: string;
  product?: Product;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'credit' | 'bank_transfer';

// Cart Types (for POS)
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Cart {
  items: CartItem[];
  customerId?: string;
  customer?: Customer;
  subtotal: number;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  taxAmount: number;
  total: number;
  couponCode?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'low_stock_alert'
  | 'out_of_stock'
  | 'payment_received'
  | 'payment_reminder'
  | 'new_invoice'
  | 'large_sale'
  | 'user_login'
  | 'stock_transfer'
  | 'daily_summary';

// Report Types
export interface DailySummary {
  date: string;
  totalSales: number;
  totalTransactions: number;
  totalTax: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Settings Types
export interface InvoiceSettings {
  prefix: string;
  startNumber: number;
  termsAndConditions?: string;
  footerText?: string;
  showLogo: boolean;
  showQrCode: boolean;
}

export interface TaxSettings {
  country: TaxCountry;
  gstEnabled: boolean;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  vatRate: number;
  salesTaxRate: number;
}
