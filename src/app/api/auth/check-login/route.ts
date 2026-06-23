import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCollection } from "@/lib/mongodb";
import type { AppUser } from "@/types/user";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "invalid_fields" }, { status: 400 });
    }

    const usersCol = await getCollection<AppUser>("users");
    const user = await usersCol.findOne({ email: email.toLowerCase().trim() } as any);
    
    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: false, error: "invalid_credentials" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash as string);
    if (!isValid) {
      return NextResponse.json({ success: false, error: "invalid_credentials" }, { status: 400 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ success: false, error: "email_not_verified" }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] check-login error:", error);
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}
