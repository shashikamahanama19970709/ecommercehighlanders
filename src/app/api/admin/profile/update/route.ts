import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCollection } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role || "customer";

    if (!session?.user?.email || role !== "admin") {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!code) {
      return NextResponse.json({ message: "Verification code is required." }, { status: 400 });
    }

    const verificationsCol = await getCollection<any>("admin_verifications");
    const verificationRecord = await verificationsCol.findOne({ token: code });

    if (!verificationRecord) {
      return NextResponse.json({ message: "Invalid verification code." }, { status: 400 });
    }

    const now = new Date();
    if (new Date(verificationRecord.expiresAt) < now) {
      await verificationsCol.deleteOne({ token: code });
      return NextResponse.json({ message: "Verification code has expired. Please try again." }, { status: 400 });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
    const usersCol = await getCollection<any>("users");

    const updateFields: any = {
      updatedAt: new Date().toISOString(),
    };

    if (verificationRecord.pendingName) {
      updateFields.name = verificationRecord.pendingName;
    }
    if (verificationRecord.pendingPasswordHash) {
      updateFields.passwordHash = verificationRecord.pendingPasswordHash;
    }

    await usersCol.updateOne(
      { email: adminEmail },
      { $set: updateFields }
    );

    // Delete verification record so it can't be reused
    await verificationsCol.deleteOne({ token: code });

    return NextResponse.json({ message: "Admin profile updated successfully." });
  } catch (error) {
    console.error("Error in admin profile update handler:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
