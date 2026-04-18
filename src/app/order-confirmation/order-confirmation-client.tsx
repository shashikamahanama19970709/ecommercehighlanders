'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { NoticeBanner, type Notice } from '@/components/notice-banner';

type ConfirmState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'pending' }
  | { status: 'confirmed'; orderId?: string }
  | { status: 'error'; message: string };

export function OrderConfirmationClient() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [state, setState] = useState<ConfirmState>({ status: 'idle' });
  const [notice, setNotice] = useState<Notice>(null);

  const sessionId = searchParams.get('session_id') ?? '';

  useEffect(() => {
    if (!sessionId) {
      setState({ status: 'error', message: 'Missing payment session.' });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    (async () => {
      try {
        const res = await fetch(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          const out = await res.json().catch(() => ({}));
          const message = (out as any)?.message ?? 'Failed to confirm payment.';
          if (!cancelled) {
            setState({ status: 'error', message });
            setNotice({ type: 'error', message });
          }
          return;
        }

        const out = (await res.json()) as { status?: string; orderId?: string; paymentStatus?: string };

        if (out.status === 'pending') {
          if (!cancelled) {
            setState({ status: 'pending' });
            setNotice({ type: 'info', message: 'Payment is still processing. Please refresh in a moment.' });
          }
          return;
        }

        if (!cancelled) {
          clearCart();
          setState({ status: 'confirmed', orderId: out.orderId });
        }
      } catch {
        if (!cancelled) {
          setState({ status: 'error', message: 'Failed to confirm payment.' });
          setNotice({ type: 'error', message: 'Failed to confirm payment.' });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clearCart, sessionId]);

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
        ? 'Your payment is still processing. Please refresh in a moment.'
        : state.status === 'error'
          ? state.message
          : 'Please wait while we confirm your payment.';

  return (
    <div className="flex-1">
      <div className="mx-auto w-full max-w-2xl px-6 py-16 text-center">
        <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        {state.status === 'confirmed' && state.orderId ? (
          <p className="mt-3 text-sm text-muted-foreground">Order ID: {state.orderId}</p>
        ) : null}
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
