import { create } from 'zustand';
import { Product } from '@/types';
import { mockProducts } from '@/data/mockData';

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  type: 'low_stock' | 'out_of_stock';
  timestamp: Date;
  dismissed: boolean;
}

interface InventoryStore {
  products: Product[];
  stockAlerts: StockAlert[];
  
  // Actions
  getProduct: (productId: string) => Product | undefined;
  updateStock: (productId: string, quantity: number) => void;
  deductStock: (productId: string, quantity: number) => boolean;
  restockProduct: (productId: string, quantity: number) => void;
  checkLowStock: (productId: string) => boolean;
  getLowStockProducts: () => Product[];
  getOutOfStockProducts: () => Product[];
  dismissAlert: (alertId: string) => void;
  clearDismissedAlerts: () => void;
  getActiveAlerts: () => StockAlert[];
}

const generateAlertId = () => `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createStockAlert = (product: Product): StockAlert => ({
  id: generateAlertId(),
  productId: product.id,
  productName: product.name,
  currentStock: product.stockQuantity,
  threshold: product.lowStockThreshold,
  type: product.stockQuantity === 0 ? 'out_of_stock' : 'low_stock',
  timestamp: new Date(),
  dismissed: false,
});

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  products: [...mockProducts],
  stockAlerts: [],

  getProduct: (productId: string) => {
    return get().products.find(p => p.id === productId);
  },

  updateStock: (productId: string, quantity: number) => {
    set(state => {
      const updatedProducts = state.products.map(product => {
        if (product.id === productId) {
          return { ...product, stockQuantity: Math.max(0, quantity) };
        }
        return product;
      });

      // Check for new alerts
      const product = updatedProducts.find(p => p.id === productId);
      let newAlerts = [...state.stockAlerts];
      
      if (product && product.stockQuantity <= product.lowStockThreshold) {
        // Check if alert already exists for this product
        const existingAlert = state.stockAlerts.find(
          a => a.productId === productId && !a.dismissed
        );
        
        if (!existingAlert) {
          newAlerts.push(createStockAlert(product));
        } else {
          // Update existing alert
          newAlerts = newAlerts.map(a => 
            a.productId === productId && !a.dismissed
              ? { ...a, currentStock: product.stockQuantity, type: product.stockQuantity === 0 ? 'out_of_stock' : 'low_stock' }
              : a
          );
        }
      }

      return { products: updatedProducts, stockAlerts: newAlerts };
    });
  },

  deductStock: (productId: string, quantity: number) => {
    const product = get().getProduct(productId);
    if (!product) return false;
    
    const newQuantity = product.stockQuantity - quantity;
    if (newQuantity < 0) return false;
    
    get().updateStock(productId, newQuantity);
    return true;
  },

  restockProduct: (productId: string, quantity: number) => {
    const product = get().getProduct(productId);
    if (!product) return;
    
    const newQuantity = product.stockQuantity + quantity;
    get().updateStock(productId, newQuantity);
    
    // Remove alert if stock is above threshold
    if (newQuantity > product.lowStockThreshold) {
      set(state => ({
        stockAlerts: state.stockAlerts.filter(a => a.productId !== productId)
      }));
    }
  },

  checkLowStock: (productId: string) => {
    const product = get().getProduct(productId);
    if (!product) return false;
    return product.stockQuantity <= product.lowStockThreshold;
  },

  getLowStockProducts: () => {
    return get().products.filter(
      p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold
    );
  },

  getOutOfStockProducts: () => {
    return get().products.filter(p => p.stockQuantity === 0);
  },

  dismissAlert: (alertId: string) => {
    set(state => ({
      stockAlerts: state.stockAlerts.map(alert =>
        alert.id === alertId ? { ...alert, dismissed: true } : alert
      )
    }));
  },

  clearDismissedAlerts: () => {
    set(state => ({
      stockAlerts: state.stockAlerts.filter(a => !a.dismissed)
    }));
  },

  getActiveAlerts: () => {
    return get().stockAlerts.filter(a => !a.dismissed);
  },
}));
