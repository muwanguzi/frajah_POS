import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
  stock: number;
}

export interface POSCustomer {
  id: string;
  name: string;
  phone?: string;
  loyaltyPoints?: number;
}

export interface PaymentLine {
  method: string;
  amount: number;
  reference?: string;
}

export interface POSSession {
  id: string;
  branchId: string;
  cashierId: string;
  openingCash: number;
  openedAt: string;
}

interface POSStore {
  session: POSSession | null;
  cart: CartItem[];
  customer: POSCustomer | null;
  payments: PaymentLine[];
  discountAmount: number;
  taxRate: number;
  setSession: (session: POSSession | null) => void;
  addToCart: (item: Omit<CartItem, 'lineTotal'>) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setCustomer: (customer: POSCustomer | null) => void;
  addPayment: (payment: PaymentLine) => void;
  clearPayments: () => void;
  setDiscountAmount: (amount: number) => void;
}

export const usePOSStore = create<POSStore>()(
  persist(
    (set) => ({
      session: null,
      cart: [],
      customer: null,
      payments: [],
      discountAmount: 0,
      taxRate: 0.18,
      setSession: (session) => set({ session }),
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.productId === item.productId
                  ? {
                      ...i,
                      quantity: i.quantity + item.quantity,
                      lineTotal:
                        (i.quantity + item.quantity) *
                        i.unitPrice *
                        (1 - i.discountPercent / 100),
                    }
                  : i
              ),
            };
          }
          const lineTotal =
            item.quantity *
            item.unitPrice *
            (1 - (item.discountPercent || 0) / 100);
          return { cart: [...state.cart, { ...item, lineTotal }] };
        }),
      updateCartItem: (productId, updates) =>
        set((state) => ({
          cart: state.cart.map((i) => {
            if (i.productId !== productId) return i;
            const updated = { ...i, ...updates };
            updated.lineTotal =
              updated.quantity *
              updated.unitPrice *
              (1 - updated.discountPercent / 100);
            return updated;
          }),
        })),
      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((i) => i.productId !== productId),
        })),
      clearCart: () =>
        set({ cart: [], customer: null, payments: [], discountAmount: 0 }),
      setCustomer: (customer) => set({ customer }),
      addPayment: (payment) =>
        set((state) => ({ payments: [...state.payments, payment] })),
      clearPayments: () => set({ payments: [] }),
      setDiscountAmount: (amount) => set({ discountAmount: amount }),
    }),
    {
      name: 'franjah-pos-cart',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export const usePOSComputations = () => {
  const { cart, discountAmount, taxRate } = usePOSStore();
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * taxRate;
  const grandTotal = afterDiscount + taxAmount;
  return { subtotal, discountAmount, taxAmount, grandTotal };
};
