'use client';

import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
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
  | { type: 'CLEAR_CART' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const productId = typeof action.product._id === 'string' ? action.product._id : action.product._id ? String(action.product._id) : '';
      if (!productId) return state;

      const existingItem = state.items.find(item => {
        const itemId = typeof item.product._id === 'string' ? item.product._id : item.product._id ? String(item.product._id) : '';
        return itemId === productId;
      });
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            (typeof item.product._id === 'string' ? item.product._id : item.product._id ? String(item.product._id) : '') === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { product: { ...action.product, _id: productId }, quantity: 1 }],
      };
    }
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => {
          const itemId = typeof item.product._id === 'string' ? item.product._id : item.product._id ? String(item.product._id) : '';
          return itemId !== action.id;
        }),
      };
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => {
            const itemId = typeof item.product._id === 'string' ? item.product._id : item.product._id ? String(item.product._id) : '';
            return itemId !== action.id;
          }),
        };
      }
      return {
        ...state,
        items: state.items.map(item =>
          (typeof item.product._id === 'string' ? item.product._id : item.product._id ? String(item.product._id) : '') === action.id
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    cartReducer,
    { items: [] },
    (initialState) => {
      if (typeof window === 'undefined') return initialState;

      try {
        const raw = window.localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return initialState;
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return initialState;

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

            return { product, quantity } satisfies CartItem;
          })
          .filter(Boolean) as CartItem[];

        return { items };
      } catch {
        return initialState;
      }
    }
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }, [state.items]);

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_TO_CART', product });
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