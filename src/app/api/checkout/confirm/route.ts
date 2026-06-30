import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ObjectId } from 'mongodb';
import { getCollection } from '@/lib/mongodb';
import type { Order, OrderItemSnapshot } from '@/types/order';
import { sendMail } from '@/lib/email';
import { getCustomerInvoiceTemplate, getAdminAlertTemplate } from '@/lib/email-templates';

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
    const order = {
      email: checkoutDoc.email,
      userId: null,
      currency: checkoutDoc.currency,
      currencyRate: (checkoutDoc as any).currencyRate ?? 1.0,
      currencySymbol: (checkoutDoc as any).currencySymbol ?? '$',
      items: checkoutDoc.items,
      totalUsd: checkoutDoc.totalUsd,
      status: 'paid',
      stripeSessionId: sessionId,
      shipping: checkoutDoc.shipping ?? undefined,
      tax: checkoutDoc.tax ?? undefined,
      discount: checkoutDoc.discount ?? undefined,
      createdAt: now,
      updatedAt: now,
    };

    const insert = await ordersCol.insertOne(order as any);
    const orderId = insert.insertedId.toString();

    // Helper to format currency pricing in the text receipt
    const formatReceiptPrice = (amount: number, rate: number, symbol: string) => {
      const converted = amount * rate;
      const space = symbol.length > 1 ? ' ' : '';
      return `${symbol}${space}${converted.toFixed(2)}`;
    };

    // Helper to generate a clean, professional text receipt
    const generateTextReceipt = (ord: any, id: string): string => {
      const r = ord.currencyRate || 1.0;
      const s = ord.currencySymbol || '$';
      const formattedSubtotal = formatReceiptPrice(
        ord.items.reduce((sum: number, item: any) => sum + item.priceUsd * item.quantity, 0),
        r,
        s
      );
      const formattedShipping = ord.shipping ? formatReceiptPrice(ord.shipping.cost, r, s) : 'Free';
      const formattedTax = ord.tax ? formatReceiptPrice(ord.tax.amount, r, s) : '0.00';
      const formattedDiscount = ord.discount ? formatReceiptPrice(ord.discount.amount, r, s) : '0.00';
      const formattedTotal = formatReceiptPrice(ord.totalUsd, r, s);

      const divider = "==================================================";
      const itemDivider = "--------------------------------------------------";

      let textContent = `${divider}\n`;
      textContent += `          HIGHLANDERS SPORTS & FITNESS\n`;
      textContent += `                ORDER RECEIPT\n`;
      textContent += `${divider}\n`;
      textContent += `Invoice Reference: #${id.toUpperCase()}\n`;
      textContent += `Date: ${new Date(ord.createdAt || Date.now()).toLocaleString()}\n`;
      textContent += `Customer: ${ord.email}\n`;
      if (ord.stripeSessionId) {
        textContent += `Stripe Reference: ${ord.stripeSessionId}\n`;
      }
      textContent += `${divider}\n\n`;
      
      textContent += `ITEMS PURCHASED:\n`;
      textContent += `${itemDivider}\n`;
      
      ord.items.forEach((item: any) => {
        const itemPrice = formatReceiptPrice(item.priceUsd, r, s);
        const itemTotal = formatReceiptPrice(item.priceUsd * item.quantity, r, s);
        textContent += `${item.name}\n`;
        textContent += `  Qty: ${item.quantity} x ${itemPrice} = ${itemTotal}\n`;
        textContent += `${itemDivider}\n`;
      });
      textContent += `\n`;
      
      textContent += `COST SUMMARY:\n`;
      textContent += `${itemDivider}\n`;
      textContent += `Subtotal:               ${formattedSubtotal}\n`;
      textContent += `Shipping:               ${formattedShipping}\n`;
      textContent += `Taxes:                  ${formattedTax}\n`;
      if (ord.discount) {
        textContent += `Discount:              -${formattedDiscount}\n`;
      }
      textContent += `${itemDivider}\n`;
      textContent += `GRAND TOTAL:            ${formattedTotal}\n`;
      textContent += `${divider}\n\n`;
      textContent += `Thank you for training with Highlanders Sports & Fitness!\n`;
      textContent += `For support, contact support@highlandersfitness.store or +44 7491807132.\n`;
      textContent += `${divider}\n`;
      
      return textContent;
    };

    // Send customer invoice and admin alert asynchronously without blocking the checkout confirm response
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const orderWithId = { ...order, _id: orderId };
      const invoiceRef = orderId.slice(-6).toUpperCase();

      // 1. Send Customer Invoice (with attachment receipts)
      await sendMail({
        to: order.email,
        subject: `Your order confirmation - Invoice #${invoiceRef}`,
        html: getCustomerInvoiceTemplate(orderWithId),
        fromKey: 'orders',
        attachments: [
          {
            filename: `invoice-${invoiceRef}.html`,
            content: getCustomerInvoiceTemplate(orderWithId),
            contentType: 'text/html',
          },
          {
            filename: `receipt-${invoiceRef}.txt`,
            content: generateTextReceipt(order, orderId),
            contentType: 'text/plain',
          }
        ]
      }).catch(err => console.error('Failed to send invoice to customer:', err));

      // 2. Send Admin Alert
      const adminEmail = process.env.ADMIN_EMAIL || 'info@highlandersfitness.store';
      const adminViewUrl = `${appUrl}/admin/checkout/${orderId}`;
      await sendMail({
        to: adminEmail,
        subject: `[New Order Alert] - Invoice #${invoiceRef}`,
        html: getAdminAlertTemplate(orderWithId, adminViewUrl),
        fromKey: 'info',
      }).catch(err => console.error('Failed to send admin notification:', err));
    } catch (emailErr) {
      console.error('Error during post-checkout email processing:', emailErr);
    }

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
