import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { Address } from '@/lib/models/Address';
import dbConnect from '@/lib/mongodb';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user._id;
  const { id } = params;
  const data = await req.json();
  const address = await Address.findOneAndUpdate({ _id: id, userId }, data, { new: true });
  if (!address) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(address);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user._id;
  const { id } = params;
  const address = await Address.findOneAndDelete({ _id: id, userId });
  if (!address) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
