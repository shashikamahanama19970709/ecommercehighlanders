'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { NoticeBanner, type Notice } from '@/components/notice-banner';
import type { Order } from '@/types/order';

type ConfirmState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'pending' }
  | { status: 'confirmed'; orderId?: string; order?: Order }
  | { status: 'error'; message: string };

function formatOrderPrice(amount: number, order?: any) {
  if (!order) return `$${amount.toFixed(2)}`;
  const rate = order.currencyRate || 1.0;
  const symbol = order.currencySymbol || '$';
  const converted = amount * rate;
  const space = symbol.length > 1 ? ' ' : '';
  return `${symbol}${space}${converted.toFixed(2)}`;
}

type ConfirmResponse = {
  status?: 'pending' | 'confirmed' | 'failed';
  orderId?: string;
  message?: string;
};

export function OrderConfirmationClient() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const [state, setState] = useState<ConfirmState>({ status: 'idle' });
  const [notice, setNotice] = useState<Notice | null>(null);
  const sessionId = searchParams.get('session_id') ?? '';
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!sessionId || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    let cancelled = false;
    setState({ status: 'loading' });

    const confirmPayment = async () => {
      try {
        const res = await fetch(
          `/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`,
          { cache: 'no-store' }
        );
        const out: ConfirmResponse = await res.json().catch(() => ({}));

        if (!res.ok) {
          const message = out.message ?? 'Failed to confirm payment.';
          if (!cancelled) {
            setState({ status: 'error', message });
            setNotice({ type: 'error', message });
          }
          return;
        }

        if (out.status === 'pending') {
          if (!cancelled) {
            setState({ status: 'pending' });
            setNotice({
              type: 'info',
              message: 'Payment is still processing. Please refresh shortly.',
            });
          }
          return;
        }

        if (out.status === 'failed') {
          const message = out.message ?? 'Payment failed.';
          if (!cancelled) {
            setState({ status: 'error', message });
            setNotice({ type: 'error', message });
          }
          return;
        }

        let order: Order | undefined;
        if (out.orderId) {
          try {
            const orderRes = await fetch(`/api/orders/${out.orderId}`, {
              cache: 'no-store',
            });
            if (orderRes.ok) order = await orderRes.json();
          } catch {
            // ignore errors
          }
        }

        if (!cancelled) {
          clearCart();
          setState({ status: 'confirmed', orderId: out.orderId, order });
        }
      } catch {
        if (!cancelled) {
          const message = 'Failed to confirm payment.';
          setState({ status: 'error', message });
          setNotice({ type: 'error', message });
        }
      }
    };

    confirmPayment();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const title =
    state.status === 'confirmed'
      ? 'Order Confirmed!'
      : state.status === 'pending'
      ? 'Payment Processing'
      : state.status === 'error'
      ? 'Payment Confirmation Failed'
      : 'Confirming Payment…';

  const description =
    state.status === 'confirmed'
      ? 'Thank you for your purchase. Your order has been placed successfully.'
      : state.status === 'pending'
      ? 'Your payment is still processing. Please refresh shortly.'
      : state.status === 'error'
      ? state.message
      : 'Please wait while we confirm your payment.';

  return (
    <div className="flex-1">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center">
        <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>

        {state.status === 'confirmed' && state.orderId && (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Order ID: {state.orderId}
            </p>

            {state.order?.items?.length ? (
              <div className="mt-6 text-left mx-auto max-w-md border rounded p-4 bg-background">
                <div className="font-semibold mb-2">Order Details</div>
                <ul className="text-sm space-y-1">
                  {state.order.items.map((item, i) => (
                    <li key={`${item.name}-${i}`}>
                      {item.name} × {item.quantity}
                      <span className="float-right">
                        {formatOrderPrice(item.priceUsd * item.quantity, state.order)}
                      </span>
                    </li>
                  ))}
                  {state.order.shipping && (
                    <li>
                      Shipping:
                      <span className="float-right">
                        {formatOrderPrice(state.order.shipping.cost, state.order)}{' '}
                        <span className="text-xs">({state.order.shipping.label})</span>
                      </span>
                    </li>
                  )}
                  {state.order.tax && (
                    <li>
                      Tax:
                      <span className="float-right">
                        {formatOrderPrice(state.order.tax.amount, state.order)}{' '}
                        <span className="text-xs">({state.order.tax.label})</span>
                      </span>
                    </li>
                  )}
                  {state.order.discount && (
                    <li>
                      Discount:
                      <span className="float-right">
                        -{formatOrderPrice(state.order.discount.amount, state.order)}{' '}
                        <span className="text-xs">({state.order.discount.label})</span>
                      </span>
                    </li>
                  )}
                  <li className="font-semibold border-t pt-2 mt-2">
                    Total:
                    <span className="float-right">{formatOrderPrice(state.order.totalUsd, state.order)}</span>
                  </li>
                </ul>
              </div>
            ) : null}

            {state.order?.deliveryLocation && (
              <div className="mt-6 text-left mx-auto max-w-md border rounded p-4 bg-background">
                <div className="font-semibold mb-2">Delivery Location</div>
                <div className="text-xs">
                  Lat: {state.order.deliveryLocation.lat}, Lng:{' '}
                  {state.order.deliveryLocation.lng}
                  <br />
                  Updated:{' '}
                  {new Date(state.order.deliveryLocation.updatedAt).toLocaleString()}
                </div>
              </div>
            )}
          </>
        )}

        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}