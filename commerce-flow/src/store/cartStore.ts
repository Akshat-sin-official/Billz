import { create } from 'zustand';
import { CartItem, Product, Customer, Cart } from '@/types';
import { useInventoryStore } from './inventoryStore';

const MANUAL_PRODUCT_PREFIX = 'manual-';

interface CartStore extends Cart {
  heldCart: Cart | null;
  // Actions
  addItem: (product: Product, quantity?: number) => { success: boolean; message?: string };
  addManualItem: (data: { name: string; unit: string; pricePerUnit: number; quantity: number; taxRate?: number }) => { success: boolean; message?: string };
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => { success: boolean; message?: string };
  updateItemDiscount: (productId: string, discount: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (amount: number, type: 'percentage' | 'fixed') => void;
  setCouponCode: (code: string | null) => void;
  clearCart: () => void;
  calculateTotals: () => void;
  completeSale: () => { success: boolean; message?: string };
  getAvailableStock: (productId: string) => number;
  holdCart: () => boolean;
  recallHeldCart: () => boolean;
}

const initialState: Cart = {
  items: [],
  customerId: undefined,
  customer: undefined,
  subtotal: 0,
  discountAmount: 0,
  discountType: 'fixed',
  taxAmount: 0,
  total: 0,
  couponCode: undefined,
};

export const useCartStore = create<CartStore>((set, get) => ({
  ...initialState,
  heldCart: null,

  getAvailableStock: (productId: string) => {
    const inventoryStore = useInventoryStore.getState();
    const product = inventoryStore.getProduct(productId);
    if (!product) return 0;
    
    // Subtract quantity already in cart
    const cartItem = get().items.find(item => item.productId === productId);
    const inCartQty = cartItem?.quantity || 0;
    
    return Math.max(0, product.stockQuantity - inCartQty);
  },

  addItem: (product: Product, quantity = 1) => {
    const { items } = get();
    const inventoryStore = useInventoryStore.getState();
    const currentProduct = inventoryStore.getProduct(product.id);
    
    if (!currentProduct) {
      return { success: false, message: 'Product not found' };
    }

    const existingItem = items.find(item => item.productId === product.id);
    const currentInCart = existingItem?.quantity || 0;
    const requestedTotal = currentInCart + quantity;

    // Check stock availability
    if (requestedTotal > currentProduct.stockQuantity) {
      const available = currentProduct.stockQuantity - currentInCart;
      if (available <= 0) {
        return { 
          success: false, 
          message: `${product.name} is out of stock` 
        };
      }
      return { 
        success: false, 
        message: `Only ${available} more ${product.name} available` 
      };
    }

    if (existingItem) {
      get().updateQuantity(product.id, existingItem.quantity + quantity);
    } else {
      const taxAmount = (product.basePrice * quantity * product.taxRate) / 100;
      const newItem: CartItem = {
        productId: product.id,
        product: currentProduct,
        quantity,
        unitPrice: product.basePrice,
        discountAmount: 0,
        taxRate: product.taxRate,
        taxAmount,
        total: product.basePrice * quantity + taxAmount,
      };

      set(state => ({
        items: [...state.items, newItem],
      }));
    }
    
    get().calculateTotals();
    
    // Check for low stock warning
    const remainingStock = currentProduct.stockQuantity - requestedTotal;
    if (remainingStock <= currentProduct.lowStockThreshold && remainingStock > 0) {
      return { 
        success: true, 
        message: `Low stock warning: Only ${remainingStock} ${product.name} left` 
      };
    }
    
    return { success: true };
  },

  addManualItem: (data) => {
    const { name, unit, pricePerUnit, quantity, taxRate = 0 } = data;
    const productId = `${MANUAL_PRODUCT_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const taxAmount = (pricePerUnit * quantity * taxRate) / 100;
    const total = pricePerUnit * quantity + taxAmount;
    const syntheticProduct: Product = {
      id: productId,
      organizationId: 'org-1',
      name,
      sku: `MANUAL-${Date.now()}`,
      unit,
      basePrice: pricePerUnit,
      taxRate,
      stockQuantity: 9999,
      lowStockThreshold: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const newItem: CartItem = {
      productId,
      product: syntheticProduct,
      quantity,
      unitPrice: pricePerUnit,
      discountAmount: 0,
      taxRate,
      taxAmount,
      total,
    };
    set((state) => ({ items: [...state.items, newItem] }));
    get().calculateTotals();
    return { success: true };
  },

  removeItem: (productId: string) => {
    set(state => ({
      items: state.items.filter(item => item.productId !== productId),
    }));
    get().calculateTotals();
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return { success: true };
    }

    const inventoryStore = useInventoryStore.getState();
    const product = inventoryStore.getProduct(productId);
    
    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    if (quantity > product.stockQuantity) {
      return { 
        success: false, 
        message: `Only ${product.stockQuantity} ${product.name} available` 
      };
    }

    set(state => ({
      items: state.items.map(item => {
        if (item.productId === productId) {
          const subtotal = item.unitPrice * quantity - item.discountAmount;
          const taxAmount = (subtotal * item.taxRate) / 100;
          return {
            ...item,
            quantity,
            taxAmount,
            total: subtotal + taxAmount,
          };
        }
        return item;
      }),
    }));
    
    get().calculateTotals();
    return { success: true };
  },

  updateItemDiscount: (productId: string, discount: number) => {
    set(state => ({
      items: state.items.map(item => {
        if (item.productId === productId) {
          const subtotal = item.unitPrice * item.quantity - discount;
          const taxAmount = (subtotal * item.taxRate) / 100;
          return {
            ...item,
            discountAmount: discount,
            taxAmount,
            total: subtotal + taxAmount,
          };
        }
        return item;
      }),
    }));
    
    get().calculateTotals();
  },

  setCustomer: (customer: Customer | null) => {
    set({
      customer: customer || undefined,
      customerId: customer?.id,
    });
  },

  setDiscount: (amount: number, type: 'percentage' | 'fixed') => {
    set({ discountAmount: amount, discountType: type });
    get().calculateTotals();
  },

  setCouponCode: (code: string | null) => {
    set({ couponCode: code || undefined });
  },

  clearCart: () => {
    set(initialState);
  },

  calculateTotals: () => {
    const { items, discountAmount, discountType } = get();
    
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity - item.discountAmount,
      0
    );
    
    const itemTaxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
    
    let billDiscount = 0;
    if (discountType === 'percentage') {
      billDiscount = (subtotal * discountAmount) / 100;
    } else {
      billDiscount = discountAmount;
    }
    
    const total = subtotal - billDiscount + itemTaxAmount;
    
    set({
      subtotal,
      taxAmount: itemTaxAmount,
      total: Math.max(0, total),
    });
  },

  completeSale: () => {
    const { items } = get();
    const inventoryStore = useInventoryStore.getState();
    
    for (const item of items) {
      if (item.productId.startsWith(MANUAL_PRODUCT_PREFIX)) continue;
      const product = inventoryStore.getProduct(item.productId);
      if (!product) {
        return { 
          success: false, 
          message: `Product ${item.product?.name || item.productId} not found` 
        };
      }
      if (product.stockQuantity < item.quantity) {
        return { 
          success: false, 
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}` 
        };
      }
    }

    for (const item of items) {
      if (item.productId.startsWith(MANUAL_PRODUCT_PREFIX)) continue;
      inventoryStore.deductStock(item.productId, item.quantity);
    }

    // Clear the cart
    get().clearCart();
    
    return { success: true };
  },

  holdCart: () => {
    const { items } = get();
    if (items.length === 0) return false;
    const cart: Cart = {
      items: JSON.parse(JSON.stringify(get().items)),
      customerId: get().customerId,
      customer: get().customer,
      subtotal: get().subtotal,
      discountAmount: get().discountAmount,
      discountType: get().discountType,
      taxAmount: get().taxAmount,
      total: get().total,
      couponCode: get().couponCode,
    };
    set({ ...initialState, heldCart: cart });
    return true;
  },

  recallHeldCart: () => {
    const { heldCart } = get();
    if (!heldCart || heldCart.items.length === 0) return false;
    const inventoryStore = useInventoryStore.getState();
    const restoredItems: CartItem[] = heldCart.items.map((item) => {
      const product = inventoryStore.getProduct(item.productId);
      return {
        ...item,
        product: product || item.product,
      };
    }).filter((item) => item.product);
    set({
      items: restoredItems,
      customerId: heldCart.customerId,
      customer: heldCart.customer,
      subtotal: heldCart.subtotal,
      discountAmount: heldCart.discountAmount,
      discountType: heldCart.discountType,
      taxAmount: heldCart.taxAmount,
      total: heldCart.total,
      couponCode: heldCart.couponCode,
      heldCart: null,
    });
    return true;
  },
}));
