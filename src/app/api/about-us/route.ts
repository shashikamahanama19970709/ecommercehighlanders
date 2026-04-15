import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import AboutUsModule from '@/lib/models/AboutUsModule';

export async function GET() {
  await connectToDatabase();
  const doc = await AboutUsModule.findOne({ moduleName: 'about-us' }).lean();
  return NextResponse.json(doc ?? null);
}

export async function PUT(req: Request) {
  await connectToDatabase();
  const body = (await req.json()) as {
    title?: unknown;
    description?: unknown;
    image1Key?: unknown;
    image1Url?: unknown;
    image2Key?: unknown;
    image2Url?: unknown;
  };

  const title = typeof body.title === 'string' ? body.title : '';
  const description = typeof body.description === 'string' ? body.description : '';
  const image1Key = typeof body.image1Key === 'string' ? body.image1Key : undefined;
  const image1Url = typeof body.image1Url === 'string' ? body.image1Url : undefined;
  const image2Key = typeof body.image2Key === 'string' ? body.image2Key : undefined;
  const image2Url = typeof body.image2Url === 'string' ? body.image2Url : undefined;

  const updated = await AboutUsModule.findOneAndUpdate(
    { moduleName: 'about-us' },
    {
      moduleName: 'about-us',
      title,
      description,
      image1Key,
      image1Url,
      image2Key,
      image2Url,
    },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json(updated);
}
