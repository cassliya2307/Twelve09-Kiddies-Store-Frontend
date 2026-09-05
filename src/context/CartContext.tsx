'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import type { Product, ProductListItem } from '@/types/api';
import { getProduct } from '@/lib/api';

export interface CartItem {
  productId: number;
  product: Product | ProductListItem;
  quantity: number;
  unitPrice: string;
}

interface CartState {
  items: CartItem[];
  isInitialized: boolean;
  lastRefreshed: number | null;
}

type CartAction =
  | { type: 'INIT'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: { product: Product | ProductListItem; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'INCREMENT_QUANTITY'; payload: number }
  | { type: 'DECREMENT_QUANTITY'; payload: number }
  | { type: 'CLEAR_CART' }
  | { type: 'CLAMP_TO_STOCK'; payload: { productId: number; maxQuantity: number } }
  | { type: 'REFRESH_CART'; payload: CartItem[] };

const STORAGE_KEY = 'twelve09-cart-v1';

function getMaxQuantity(product: Product | ProductListItem): number {
  return product.stock_quantity ?? 0;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'INIT':
      return { ...state, items: action.payload, isInitialized: true };

    case 'ADD_ITEM': {
      const { product, quantity } = action.payload;
      const existingIndex = state.items.findIndex((item) => item.productId === product.id);

      if (existingIndex >= 0) {
        const newItems = [...state.items];
        const maxQuantity = getMaxQuantity(product);
        const newQuantity = Math.min(newItems[existingIndex].quantity + quantity, maxQuantity);
        newItems[existingIndex] = { ...newItems[existingIndex], quantity: newQuantity };
        return { ...state, items: newItems };
      }

      const maxQuantity = getMaxQuantity(product);
      const clampedQuantity = Math.min(quantity, maxQuantity);
      if (clampedQuantity <= 0) return state;

      const newItem: CartItem = {
        productId: product.id,
        product,
        quantity: clampedQuantity,
        unitPrice: product.price,
      };
      return { ...state, items: [...state.items, newItem] };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((item) => item.productId !== action.payload);
      return { ...state, items: newItems };
    }

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return { ...state, items: state.items.filter((item) => item.productId !== productId) };
      }
      const item = state.items.find((i) => i.productId === productId);
      if (!item) return state;
      const maxQuantity = getMaxQuantity(item.product);
      const clampedQuantity = Math.min(quantity, maxQuantity);
      if (clampedQuantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.productId !== productId) };
      }
      const newItems = state.items.map((item) =>
        item.productId === productId ? { ...item, quantity: clampedQuantity } : item
      );
      return { ...state, items: newItems };
    }

    case 'INCREMENT_QUANTITY': {
      const newItems = state.items.map((item) => {
        if (item.productId !== action.payload) return item;
        const maxQuantity = getMaxQuantity(item.product);
        const newQuantity = Math.min(item.quantity + 1, maxQuantity);
        return { ...item, quantity: newQuantity };
      });
      return { ...state, items: newItems };
    }

    case 'DECREMENT_QUANTITY': {
      const newItems = state.items.map((item) => {
        if (item.productId !== action.payload) return item;
        const newQuantity = item.quantity - 1;
        if (newQuantity <= 0) {
          return { ...item, quantity: 0 };
        }
        return { ...item, quantity: newQuantity };
      });
      return { ...state, items: newItems };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'CLAMP_TO_STOCK': {
      const { productId, maxQuantity } = action.payload;
      const newItems = state.items.map((item) => {
        if (item.productId !== productId) return item;
        if (item.quantity > maxQuantity) {
          return { ...item, quantity: maxQuantity };
        }
        return item;
      });
      return { ...state, items: newItems };
    }

    case 'REFRESH_CART':
      return { ...state, items: action.payload, lastRefreshed: Date.now() };

    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isInitialized: boolean;
  lastRefreshed: number | null;
  addToCart: (product: Product | ProductListItem, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  incrementQuantity: (productId: number) => void;
  decrementQuantity: (productId: number) => void;
  clearCart: () => void;
  clampToStock: (productId: number, maxQuantity: number) => void;
  getCartQuantity: (productId: number) => number;
  isInCart: (productId: number) => boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isInitialized: false,
    lastRefreshed: null,
  });

  const refreshCart = useCallback(async () => {
    if (state.items.length === 0) return;
    try {
      const uniqueProductIds = [...new Set(state.items.map((item) => item.productId))];
      const products = await Promise.all(
        uniqueProductIds.map((id) => getProduct(id).catch(() => null))
      );
      const productMap = new Map(
        products
          .filter((p): p is Product => p !== null)
          .map((p) => [p.id, p])
      );

      const refreshedItems = state.items
        .map((item) => {
          const freshProduct = productMap.get(item.productId);
          if (!freshProduct || !freshProduct.is_active) {
            return null; // Product no longer available
          }
          const maxQty = freshProduct.stock_quantity ?? 0;
          const clampedQty = Math.min(item.quantity, maxQty);
          if (clampedQty <= 0) return null; // Out of stock
          const refreshedItem: CartItem = {
            productId: item.productId,
            product: freshProduct,
            quantity: Math.min(item.quantity, maxQty),
            unitPrice: freshProduct.price,
          };
          return refreshedItem;
        })
        .filter((item): item is CartItem => item !== null);

      dispatch({ type: 'REFRESH_CART', payload: refreshedItems });
    } catch {
      // Silently fail - local cart data remains usable
    }
  }, [state.items]);

  // Initialize cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          dispatch({ type: 'INIT', payload: parsed });
        }
      } else {
        dispatch({ type: 'INIT', payload: [] });
      }
    } catch {
      dispatch({ type: 'INIT', payload: [] });
    }
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    if (state.isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
      } catch {
      }
    }
  }, [state.items, state.isInitialized]);

  // Refresh cart from server on mount to get current prices/stock
  useEffect(() => {
    if (state.isInitialized && state.items.length > 0) {
      refreshCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only refresh on mount after initialization
  }, [state.isInitialized, refreshCart]);

  const addToCart = useCallback((product: Product | ProductListItem, quantity: number) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  }, []);

  const incrementQuantity = useCallback((productId: number) => {
    dispatch({ type: 'INCREMENT_QUANTITY', payload: productId });
  }, []);

  const decrementQuantity = useCallback((productId: number) => {
    dispatch({ type: 'DECREMENT_QUANTITY', payload: productId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const clampToStock = useCallback((productId: number, maxQuantity: number) => {
    dispatch({ type: 'CLAMP_TO_STOCK', payload: { productId, maxQuantity } });
  }, []);

  const getCartQuantity = useCallback((productId: number) => {
    const item = state.items.find((i) => i.productId === productId);
    return item?.quantity ?? 0;
  }, [state.items]);

  const isInCart = useCallback((productId: number) => {
    return state.items.some((i) => i.productId === productId);
  }, [state.items]);

  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        subtotal,
        isInitialized: state.isInitialized,
        lastRefreshed: state.lastRefreshed,
        addToCart,
        removeFromCart,
        updateQuantity,
        incrementQuantity,
        decrementQuantity,
        clearCart,
        clampToStock,
        getCartQuantity,
        isInCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}