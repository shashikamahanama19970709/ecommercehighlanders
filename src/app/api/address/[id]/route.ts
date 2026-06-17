import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Address } from '@/lib/models/Address';
import { connectToDatabase } from '@/lib/mongodb';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const { id } = await params;
  const data = await req.json();
  const address = await Address.findOneAndUpdate({ _id: id, userId }, data, { new: true });
  if (!address) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(address);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const { id } = await params;
  const address = await Address.findOneAndDelete({ _id: id, userId });
  if (!address) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
