import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { sendMail } from "@/lib/email";
import { getSubscriptionWelcomeTemplate } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Please provide a valid email address." }, { status: 400 });
    }

    const subscriptionsCol = await getCollection<any>("newsletter_subscriptions");
    
    // Check if already subscribed
    const existing = await subscriptionsCol.findOne({ email });
    if (!existing) {
      await subscriptionsCol.insertOne({
        email,
        createdAt: new Date(),
      });
    }

    // Send the welcome email
    await sendMail({
      to: email,
      subject: "Welcome to the Squad! - Highlanders Sports & Fitness",
      html: getSubscriptionWelcomeTemplate(),
      fromKey: "support",
    });

    return NextResponse.json({ message: "Thank you for subscribing!" });
  } catch (error) {
    console.error("Error in newsletter subscription API handler:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
