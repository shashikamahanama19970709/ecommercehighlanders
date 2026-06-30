import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json({ message: "Token and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const resetsCol = await getCollection<any>("password_resets");
    const resetRecord = await resetsCol.findOne({ token });

    if (!resetRecord) {
      return NextResponse.json({ message: "Invalid or expired password reset link." }, { status: 400 });
    }

    const now = new Date();
    if (new Date(resetRecord.expiresAt) < now) {
      await resetsCol.deleteOne({ token });
      return NextResponse.json({ message: "Password reset link has expired." }, { status: 400 });
    }

    const email = resetRecord.email;
    const passwordHash = await bcrypt.hash(password, 10);
    const usersCol = await getCollection<any>("users");

    const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();

    // Check if the user exists
    const user = await usersCol.findOne({ email });

    if (user) {
      // Update existing user credentials
      await usersCol.updateOne(
        { email },
        {
          $set: {
            passwordHash,
            emailVerified: user.emailVerified || new Date(),
            updatedAt: new Date().toISOString(),
          }
        }
      );
    } else if (email === adminEmail) {
      // Create admin user dynamically if not exists (fail-safe bootstrap)
      await usersCol.insertOne({
        email,
        passwordHash,
        name: "Administrator",
        role: "admin",
        emailVerified: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({ message: "User account no longer exists." }, { status: 404 });
    }

    // Delete token so it can't be reused
    await resetsCol.deleteOne({ token });

    return NextResponse.json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Error in reset-password request handler:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
