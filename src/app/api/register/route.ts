import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCollection } from '@/lib/mongodb';
import type { AppUser } from '@/types/user';
import { randomBytes } from 'crypto';
import { sendMail } from '@/lib/email';
import { getVerificationEmailTemplate } from '@/lib/email-templates';

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters.' }, { status: 400 });
    }
    const usersCol = await getCollection<AppUser>('users');
    const existing = await usersCol.findOne({ email } as any);
    if (existing) {
      return NextResponse.json({ message: 'Email already registered.' }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const emailVerificationToken = randomBytes(32).toString('hex');
    const user: AppUser = {
      email,
      name,
      passwordHash,
      role: 'customer',
      emailVerified: false,
      emailVerificationToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await usersCol.insertOne(user as any);

    // Send verification email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${emailVerificationToken}`;
    await sendMail({
      to: email,
      subject: 'Verify your email address - Highlanders Sports',
      html: getVerificationEmailTemplate(name, verifyUrl),
      fromKey: 'support',
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ message: 'Registration failed.' }, { status: 500 });
  }
}
