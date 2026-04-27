import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { Address } from '@/lib/models/Address';
import dbConnect from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user._id;
  const addresses = await Address.find({ userId });
  return NextResponse.json(addresses);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user._id;
  const data = await req.json();
  const address = await Address.create({ ...data, userId });
  return NextResponse.json(address);
}
