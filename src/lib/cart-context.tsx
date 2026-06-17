'use client';

import { createContext, useContext, useEffect, useReducer, ReactNode, useState } from 'react';
import type { Product } from '@/types/product';
import type { CartItem } from '@/types/cart';

const CART_STORAGE_KEY = 'sportify_cart_v1';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_TO_CART'; product: Product }
  | { type: 'REMOVE_FROM_CART'; id: string }
  | { type: 'UPDATE_QUANTITY'; id: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ITEMS'; items: CartItem[] };

function getId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof (value as any)?.toString === 'function') return String(value);
  return '';
}

function getStockLimit(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const productId = getId(action.product._id);
      if (!productId) return state;

      const stockLimit = getStockLimit((action.product as any)?.stock);
      if (stockLimit !== null && stockLimit <= 0) return state;

      const existingItem = state.items.find(item => {
        const itemId = getId(item.product._id);
        return itemId === productId;
      });

      if (existingItem && stockLimit !== null && existingItem.quantity >= stockLimit) {
        return state;
      }

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            getId(item.product._id) === productId
              ? { ...item, product: { ...item.product, ...action.product, _id: productId }, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { product: { ...action.product, _id: productId }, quantity: 1, price: action.product.price }],
      };
    }
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => {
          const itemId = getId(item.product._id);
          return itemId !== action.id;
        }),
      };
    case 'UPDATE_QUANTITY':
      const existingItem = state.items.find((item) => getId(item.product._id) === action.id);
      const stockLimit = getStockLimit((existingItem?.product as any)?.stock);
      const nextQuantity =
        stockLimit !== null
          ? Math.min(Math.max(0, Math.floor(action.quantity)), stockLimit)
          : Math.max(0, Math.floor(action.quantity));

      if (nextQuantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => {
            const itemId = getId(item.product._id);
            return itemId !== action.id;
          }),
        };
      }
      return {
        ...state,
        items: state.items.map(item =>
          getId(item.product._id) === action.id
            ? { ...item, quantity: nextQuantity }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { items: [] };
    case 'SET_ITEMS':
      return { items: action.items };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => boolean;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        setHydrated(true);
        return;
      }

      const items = parsed
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const maybe = item as { product?: unknown; quantity?: unknown };

          if (!maybe.product || typeof maybe.product !== 'object') return null;
          const product = maybe.product as Product;

          const quantity =
            typeof maybe.quantity === 'number' && Number.isFinite(maybe.quantity)
              ? Math.max(1, Math.floor(maybe.quantity))
              : 1;

          if (!product?._id) return null;

          return { product, quantity, price: product.price } satisfies CartItem;
        })
        .filter(Boolean) as CartItem[];

      dispatch({ type: 'SET_ITEMS', items });
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }, [hydrated, state.items]);

  const addToCart = (product: Product) => {
    const productId = getId(product?._id);
    if (!productId) return false;

    const stockLimit = getStockLimit((product as any)?.stock);
    if (stockLimit !== null && stockLimit <= 0) return false;

    const existing = state.items.find((item) => getId(item.product._id) === productId);
    if (existing && stockLimit !== null && existing.quantity >= stockLimit) return false;

    dispatch({ type: 'ADD_TO_CART', product });
    return true;
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', id, quantity });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const total = state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}