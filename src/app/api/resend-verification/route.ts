
import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { randomBytes } from 'crypto';
import { sendMail } from '@/lib/email';
import type { AppUser } from '@/types/user';
const RATE_LIMIT_SECONDS = 60;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    const usersCol = await getCollection<AppUser>('users');
    const user = await usersCol.findOne({ email } as any);
    if (!user) return NextResponse.json({ message: 'No account found for this email.' }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ message: 'Email is already verified.' }, { status: 400 });
    // Rate limiting: allow only once per minute per email
    const now = Date.now();
    if (user.lastVerificationResend && now - user.lastVerificationResend < RATE_LIMIT_SECONDS * 1000) {
      return NextResponse.json({ message: 'Please wait before requesting another verification email.' }, { status: 429 });
    }
    // Generate new token
    const emailVerificationToken = randomBytes(32).toString('hex');
    await usersCol.updateOne(
      { _id: user._id },
      { $set: { emailVerificationToken, lastVerificationResend: now } }
    );
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/verify-email?token=${emailVerificationToken}`;
    await sendMail({
      to: email,
      subject: 'Verify your email',
      html: `<p>Hi ${user.name || ''},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ message: 'Failed to resend verification email.' }, { status: 500 });
  }
}
