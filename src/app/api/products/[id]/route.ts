import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongodb";
import type { Product } from "@/types/product";

// GET /api/products/[id]
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productsCol = await getCollection<Product>("products");

  const product = await productsCol.findOne({ _id: new ObjectId(id) } as any);
  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

// PUT /api/products/[id] - update product
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const productsCol = await getCollection<Product>("products");
  const now = new Date().toISOString();

  const update: Partial<Product> = {
    ...body,
    updatedAt: now,
  };

  await productsCol.updateOne({ _id: new ObjectId(id) } as any, { $set: update });

  const updated = await productsCol.findOne({ _id: new ObjectId(id) } as any);

  return NextResponse.json(updated);
}

// DELETE /api/products/[id] - delete product
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const productsCol = await getCollection<Product>("products");
  await productsCol.deleteOne({ _id: new ObjectId(id) } as any);

  return NextResponse.json({ success: true });
}
