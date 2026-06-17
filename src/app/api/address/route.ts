import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Address } from '@/lib/models/Address';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const addresses = await Address.find({ userId });
  return NextResponse.json(addresses);
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const data = await req.json();
  const address = await Address.create({ ...data, userId });
  return NextResponse.json(address);
}
