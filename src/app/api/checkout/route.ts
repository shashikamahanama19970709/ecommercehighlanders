import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2024-06-20" as any }) : null;

// POST /api/checkout - create Stripe Checkout Session
export async function POST(request: NextRequest) {
  if (!stripe || !process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
    return NextResponse.json(
      { message: "Stripe is not configured" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { items, currency, email } = body as {
      items: { name: string; priceUsd: number; quantity: number }[];
      currency: string;
      email: string;
    };

    const lineItems = items.map((item) => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: { name: item.name },
        unit_amount: Math.round(item.priceUsd * 100), // convert to cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: lineItems,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?cancelled=1`,
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (error) {
    console.error("Error creating Stripe checkout session", error);
    return NextResponse.json({ message: "Error creating checkout session" }, { status: 500 });
  }
}
