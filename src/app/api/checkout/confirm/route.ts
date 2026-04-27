import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ObjectId } from 'mongodb';
import { getCollection } from '@/lib/mongodb';
import type { Order, OrderItemSnapshot } from '@/types/order';

type PaymentSettingsDoc = {
  key: 'payment';
  sandboxEnabled: boolean;
};

type CheckoutSessionDoc = {
  stripeSessionId: string;
  sandboxEnabled: boolean;
  email: string;
  currency: string;
  items: OrderItemSnapshot[];
  totalUsd: number;
  status: 'created' | 'confirmed' | 'order_created' | 'failed';
  orderId?: string;
  createdAt: string;
  updatedAt: string;
};

type StripeKeyResult =
  | { ok: true; secretKey: string; mode: 'test' | 'live'; envVar: string }
  | { ok: false; message: string };

function getStripeSecretKey(sandboxEnabled: boolean): StripeKeyResult {
  const generic = process.env.STRIPE_SECRET_KEY?.trim();
  const test = process.env.STRIPE_SECRET_KEY_TEST?.trim();
  const live = process.env.STRIPE_SECRET_KEY_LIVE?.trim();

  const isValidTestKey = (key: string) => key.startsWith('sk_test_');
  const isValidLiveKey = (key: string) => key.startsWith('sk_live_');
  const isLikelyPlaceholder = (key: string) => key.toLowerCase().includes('your-') || key.toLowerCase().includes('placeholder');

  if (sandboxEnabled) {
    if (test) {
      if (isLikelyPlaceholder(test) || !isValidTestKey(test)) {
        return { ok: false, message: 'Stripe test key looks invalid (expected STRIPE_SECRET_KEY_TEST to start with sk_test_).' };
      }
      return { ok: true, secretKey: test, mode: 'test', envVar: 'STRIPE_SECRET_KEY_TEST' };
    }
    if (generic) {
      if (isLikelyPlaceholder(generic) || (!isValidTestKey(generic) && !isValidLiveKey(generic))) {
        return { ok: false, message: 'Stripe key looks invalid (expected STRIPE_SECRET_KEY to start with sk_test_ or sk_live_).' };
      }
      return { ok: true, secretKey: generic, mode: 'test', envVar: 'STRIPE_SECRET_KEY' };
    }
    return {
      ok: false,
      message: 'Stripe is not configured (Sandbox Mode is enabled; set STRIPE_SECRET_KEY_TEST).',
    };
  }

  if (live) {
    if (isLikelyPlaceholder(live) || !isValidLiveKey(live)) {
      return { ok: false, message: 'Stripe live key looks invalid (expected STRIPE_SECRET_KEY_LIVE to start with sk_live_).' };
    }
    return { ok: true, secretKey: live, mode: 'live', envVar: 'STRIPE_SECRET_KEY_LIVE' };
  }
  if (generic) {
    if (isLikelyPlaceholder(generic) || (!isValidTestKey(generic) && !isValidLiveKey(generic))) {
      return { ok: false, message: 'Stripe key looks invalid (expected STRIPE_SECRET_KEY to start with sk_test_ or sk_live_).' };
    }
    return { ok: true, secretKey: generic, mode: 'live', envVar: 'STRIPE_SECRET_KEY' };
  }
  return {
    ok: false,
    message: 'Stripe is not configured (Sandbox Mode is disabled; set STRIPE_SECRET_KEY_LIVE).',
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id') ?? '';

  if (!sessionId) {
    return NextResponse.json({ message: 'Missing session_id' }, { status: 400 });
  }

  try {
    const checkoutCol = await getCollection<CheckoutSessionDoc>('checkout_sessions');
    const checkoutDoc = await checkoutCol.findOne({ stripeSessionId: sessionId } as any);

    if (!checkoutDoc) {
      return NextResponse.json({ message: 'Checkout session not found' }, { status: 404 });
    }

    const keyResult = getStripeSecretKey(Boolean(checkoutDoc.sandboxEnabled));
    if (!keyResult.ok) return NextResponse.json({ message: keyResult.message }, { status: 500 });

    const stripe = new Stripe(keyResult.secretKey, { apiVersion: '2024-06-20' as any });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        status: 'pending',
        paymentStatus: session.payment_status,
      });
    }

    const ordersCol = await getCollection<Order>('orders');
    const existingOrder = await ordersCol.findOne({ stripeSessionId: sessionId } as any);

    if (existingOrder) {
      return NextResponse.json({ status: 'confirmed', orderId: String((existingOrder as any)._id) });
    }

    // Decrement stock atomically per item (best-effort). If any fails, mark checkout failed.
    const productsCol = await getCollection<any>('products');
    for (const item of checkoutDoc.items) {
      const productObjectId = new ObjectId(item.productId);
      const result = await productsCol.updateOne(
        { _id: productObjectId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity }, $set: { updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        await checkoutCol.updateOne(
          { stripeSessionId: sessionId } as any,
          { $set: { status: 'failed', updatedAt: new Date().toISOString() } }
        );
        return NextResponse.json({ message: 'Insufficient stock to fulfill the order' }, { status: 409 });
      }
    }

    const now = new Date().toISOString();
    const order: Order = {
      email: checkoutDoc.email,
      userId: null,
      currency: checkoutDoc.currency,
      items: checkoutDoc.items,
      totalUsd: checkoutDoc.totalUsd,
      status: 'paid',
      stripeSessionId: sessionId,
      shipping: checkoutDoc.shipping,
      tax: checkoutDoc.tax,
      discount: checkoutDoc.discount,
      createdAt: now,
      updatedAt: now,
    };

    const insert = await ordersCol.insertOne(order as any);
    const orderId = insert.insertedId.toString();

    await checkoutCol.updateOne(
      { stripeSessionId: sessionId } as any,
      { $set: { status: 'order_created', orderId, updatedAt: now } }
    );

    return NextResponse.json({ status: 'confirmed', orderId });
  } catch (error) {
    console.error('Error confirming checkout session', error);
    return NextResponse.json({ message: 'Error confirming checkout session' }, { status: 500 });
  }
}
