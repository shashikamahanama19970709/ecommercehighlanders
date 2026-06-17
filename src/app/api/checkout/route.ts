import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ObjectId } from 'mongodb';
import { getCollection } from '@/lib/mongodb';
import type { OrderItemSnapshot } from '@/types/order';

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
  shipping?: { label: string; cost: number } | null;
  tax?: { label: string; amount: number } | null;
  discount?: { label: string; amount: number } | null;
  status: 'created' | 'confirmed' | 'order_created' | 'failed';
  createdAt: string;
  updatedAt: string;
};

type CheckoutRequestBody = {
  email: string;
  currency?: string;
  items: { productId: string; quantity: number }[];
  shipping?: { label: string; cost: number };
  tax?: { label: string; amount: number };
  discount?: { label: string; amount: number };
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

const DEFAULT_CURRENCY = 'usd';

// POST /api/checkout - create Stripe Checkout Session
export async function POST(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;

  try {
    const body = (await request.json().catch(() => null)) as CheckoutRequestBody | null;

    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const currency = typeof body?.currency === 'string' && body.currency.trim() ? body.currency.trim().toLowerCase() : DEFAULT_CURRENCY;
    const requestedItems = Array.isArray(body?.items) ? body!.items : [];
    const shipping = body?.shipping && typeof body.shipping.cost === 'number' ? body.shipping : null;
    const tax = body?.tax && typeof body.tax.amount === 'number' ? body.tax : null;
    const discount = body?.discount && typeof body.discount.amount === 'number' ? body.discount : null;

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    if (requestedItems.length === 0) {
      return NextResponse.json({ message: 'Cart is empty' }, { status: 400 });
    }

    const normalized = requestedItems
      .map((i) => ({
        productId: typeof i?.productId === 'string' ? i.productId.trim() : '',
        quantity: typeof i?.quantity === 'number' && Number.isFinite(i.quantity) ? Math.max(0, Math.floor(i.quantity)) : 0,
      }))
      .filter((i) => i.productId && i.quantity > 0);

    if (normalized.length === 0) {
      return NextResponse.json({ message: 'Invalid cart items' }, { status: 400 });
    }

    const settingsCol = await getCollection<PaymentSettingsDoc>('settings');
    const settings = await settingsCol.findOne({ key: 'payment' } as any);
    const sandboxEnabled = settings?.sandboxEnabled ?? true;

    const keyResult = getStripeSecretKey(sandboxEnabled);
    if (!keyResult.ok) return NextResponse.json({ message: keyResult.message }, { status: 500 });

    const stripe = new Stripe(keyResult.secretKey, { apiVersion: '2024-06-20' as any });

    // Load products and validate stock/price server-side.
    const productsCol = await getCollection<any>('products');

    const productIds = Array.from(new Set(normalized.map((i) => i.productId)));
    const objectIds: ObjectId[] = [];
    for (const id of productIds) {
      try {
        objectIds.push(new ObjectId(id));
      } catch {
        return NextResponse.json({ message: 'Invalid product id in cart' }, { status: 400 });
      }
    }

    const products = await productsCol
      .find({ _id: { $in: objectIds }, isActive: { $ne: false } })
      .project({ name: 1, price: 1, stock: 1 })
      .toArray();

    const productById = new Map<string, any>();
    for (const p of products) {
      productById.set(String(p._id), p);
    }

    const items: OrderItemSnapshot[] = [];
    let totalUsd = 0;

    for (const line of normalized) {
      const p = productById.get(line.productId);
      if (!p) {
        return NextResponse.json({ message: 'One or more products are unavailable' }, { status: 409 });
      }

      const stock = typeof p.stock === 'number' && Number.isFinite(p.stock) ? Math.max(0, Math.floor(p.stock)) : 0;
      if (stock < line.quantity) {
        return NextResponse.json({ message: 'Insufficient stock for one or more items' }, { status: 409 });
      }

      const priceUsd = typeof p.price === 'number' && Number.isFinite(p.price) ? p.price : Number(p.price);
      if (!Number.isFinite(priceUsd) || priceUsd < 0) {
        return NextResponse.json({ message: 'Invalid product pricing' }, { status: 500 });
      }

      items.push({
        productId: line.productId,
        name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'Product',
        priceUsd,
        quantity: line.quantity,
      });

      totalUsd += priceUsd * line.quantity;
    }


    const lineItems = items.map((item) => ({
      price_data: {
        currency,
        product_data: { name: item.name },
        unit_amount: Math.round(item.priceUsd * 100),
      },
      quantity: item.quantity,
    }));
    if (shipping) {
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: shipping.label || 'Shipping' },
          unit_amount: Math.round(shipping.cost * 100),
        },
        quantity: 1,
      });
    }
    if (tax) {
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: tax.label || 'Tax' },
          unit_amount: Math.round(tax.amount * 100),
        },
        quantity: 1,
      });
    }
    if (discount) {
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: discount.label || 'Discount' },
          unit_amount: -Math.round(Math.abs(discount.amount) * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems as any,
      success_url: `${appUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout?cancelled=1`,
    });

    const now = new Date().toISOString();
    const checkoutCol = await getCollection<CheckoutSessionDoc>('checkout_sessions');
    // Ensure _id is always ObjectId for new sessions
    const existing = await checkoutCol.findOne({ stripeSessionId: session.id } as any);
    if (existing) {
      await checkoutCol.updateOne(
        { stripeSessionId: session.id } as any,
        {
          $set: {
            sandboxEnabled,
            email,
            currency: currency.toUpperCase(),
            items,
            totalUsd: Number(totalUsd),
            shipping,
            tax,
            discount,
            status: 'created',
            createdAt: now,
            updatedAt: now,
          },
        }
      );
    } else {
      await checkoutCol.insertOne({
        _id: new ObjectId(),
        stripeSessionId: session.id,
        sandboxEnabled,
        email,
        currency: currency.toUpperCase(),
        items,
        totalUsd: Number(totalUsd),
        shipping,
        tax,
        discount,
        status: 'created',
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (error) {
    console.error('Error creating Stripe checkout session', error);
    return NextResponse.json({ message: 'Error creating checkout session' }, { status: 500 });
  }
}
