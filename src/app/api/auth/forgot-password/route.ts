import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { sendMail } from "@/lib/email";
import { getForgotPasswordTemplate } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
    const usersCol = await getCollection<any>("users");
    const user = await usersCol.findOne({ email });

    // For security reasons, don't disclose if the user exists or not.
    // Just return success if the email is invalid or valid.
    if (!user && email !== adminEmail) {
      return NextResponse.json({ message: "Reset link sent if email exists." });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour expiry

    const resetsCol = await getCollection<any>("password_resets");
    // Delete any old resets for this email
    await resetsCol.deleteMany({ email });

    await resetsCol.insertOne({
      email,
      token,
      expiresAt,
      createdAt: new Date(),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // Determine target recipient.
    // If the requested reset is for the admin, redirect it to info@highlandersfitness.store!
    const targetEmail = email === adminEmail ? "info@highlandersfitness.store" : email;

    await sendMail({
      to: targetEmail,
      subject: "Reset Your Password - Highlanders Sports & Fitness",
      html: getForgotPasswordTemplate(resetUrl),
      fromKey: email === adminEmail ? "info" : "support",
    });

    return NextResponse.json({ message: "Reset link sent if email exists." });
  } catch (error) {
    console.error("Error in forgot-password request handler:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
