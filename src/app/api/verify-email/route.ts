import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import type { AppUser } from '@/types/user';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ message: 'Missing token.' }, { status: 400 });
  const usersCol = await getCollection<AppUser>('users');
  const user = await usersCol.findOne({ emailVerificationToken: token } as any);
  if (!user) return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 400 });
  await usersCol.updateOne(
    { _id: user._id },
    { $set: { emailVerified: true }, $unset: { emailVerificationToken: '' } }
  );
  return NextResponse.json({ success: true });
}
