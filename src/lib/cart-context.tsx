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

function getName(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^[a-fA-F0-9]{24}$/.test(trimmed)) return '';
    return trimmed;
  }
  const maybe = value as { name?: string };
  return maybe.name ?? '';
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

  interface CartToast {
    id: string;
    name: string;
    brand: string;
    image?: string;
  }
  const [toasts, setToasts] = useState<CartToast[]>([]);

  const addToCart = (product: Product) => {
    const productId = getId(product?._id);
    if (!productId) return false;

    const stockLimit = getStockLimit((product as any)?.stock);
    if (stockLimit !== null && stockLimit <= 0) return false;

    const existing = state.items.find((item) => getId(item.product._id) === productId);
    if (existing && stockLimit !== null && existing.quantity >= stockLimit) return false;

    dispatch({ type: 'ADD_TO_CART', product });

    // Trigger toast notification
    const toastId = Math.random().toString(36).substring(2, 9);
    const newToast: CartToast = {
      id: toastId,
      name: getName(product.equipment) || product.name || 'Gear',
      brand: getName(product.brand) || 'Highlanders',
      image: product.featureImageUrl || (Array.isArray(product.imageUrls) ? product.imageUrls[0] : undefined),
    };
    setToasts(prev => [...prev, newToast]);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 3000);

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

      {/* Global Add to Cart Toast Indicator */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-xl backdrop-blur-md pointer-events-auto animate-slide-in-right"
          >
            {/* Image */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-50 border border-slate-100">
              {toast.image ? (
                <img src={toast.image} alt={toast.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                  🛒
                </div>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#c8a84b]">
                {toast.brand || 'Highlanders'}
              </p>
              <p className="text-xs font-bold text-[#0f1a2e] truncate mt-0.5">
                {toast.name}
              </p>
              <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-0.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Added to cart successfully
              </p>
            </div>
            {/* Close button */}
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-[#94a3b8] hover:text-[#0f1a2e] p-1.5 transition-colors cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
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