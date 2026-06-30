import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCollection } from "@/lib/mongodb";
import { sendMail } from "@/lib/email";
import { getAdminProfileVerifyTemplate } from "@/lib/email-templates";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role || "customer";

    if (!session?.user?.email || role !== "admin") {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name && !password) {
      return NextResponse.json({ message: "Please specify a name or password to update." }, { status: 400 });
    }

    let pendingPasswordHash = undefined;
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
      }
      pendingPasswordHash = await bcrypt.hash(password, 10);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    const verificationsCol = await getCollection<any>("admin_verifications");
    // Delete any older verification codes
    await verificationsCol.deleteMany({});

    await verificationsCol.insertOne({
      token: code,
      pendingName: name || undefined,
      pendingPasswordHash,
      expiresAt,
      createdAt: new Date(),
    });

    // Send code to info@highlandersfitness.store
    await sendMail({
      to: "info@highlandersfitness.store",
      subject: `[Highlanders Admin] Verification Code: ${code}`,
      html: getAdminProfileVerifyTemplate(code),
      fromKey: "info",
    });

    return NextResponse.json({ message: "Verification code sent to info@highlandersfitness.store." });
  } catch (error) {
    console.error("Error in admin settings verify request handler:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
