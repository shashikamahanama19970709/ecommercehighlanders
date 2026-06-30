import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { isValidObjectId } from "mongoose";
import ProductModel from "@/lib/models/Product";
import Sport from "@/lib/models/Sport";
import Brand from "@/lib/models/Brand";
import Equipment from "@/lib/models/Equipment";
import type { Product } from "@/types/product";
import { checkAndSendRestockNotifications } from "@/lib/restock-notification";

async function resolveIdOrName(value: unknown, kind: "sport" | "brand"): Promise<string | null> {
  if (typeof value !== "string" || value.trim() === "") return null;
  if (isValidObjectId(value)) return value;

  const name = value.trim();
  if (kind === "sport") {
    const sport = await Sport.findOne({ name }).select("_id").lean();
    return sport?._id?.toString?.() ?? null;
  }

  const brand = await Brand.findOne({ name }).select("_id").lean();
  return brand?._id?.toString?.() ?? null;
}

async function resolveEquipmentId(value: unknown, sportId: string | null): Promise<string | null> {
  if (typeof value !== "string" || value.trim() === "") return null;
  if (isValidObjectId(value)) return value;
  if (!sportId) return null;

  const name = value.trim();

  const existing = await Equipment.findOne({ name, sport: sportId }).select("_id").lean();
  if (existing?._id) return existing._id.toString();

  try {
    const created = await Equipment.create({
      name,
      sport: sportId,
      category: name,
      status: "active",
      totalStock: 0,
      availableStock: 0,
      specifications: {},
    });
    return created._id.toString();
  } catch {
    const again = await Equipment.findOne({ name, sport: sportId }).select("_id").lean();
    return again?._id?.toString?.() ?? null;
  }
}

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
  if (updated && typeof updated.stock === "number" && updated.stock > 0) {
    void checkAndSendRestockNotifications(id, updated.stock);
  }

  return NextResponse.json(updated);
}

// PATCH /api/products/[id] - partial update (supports atomic restock)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  // NOTE: This route supports two modes:
  // - Atomic restock via { stockDelta: number }
  // - General edits via PATCH body fields (sport/equipment/brand can be ids or names)

  const stockDeltaRaw = (body as { stockDelta?: unknown }).stockDelta;
  const hasStockDelta = stockDeltaRaw !== undefined && stockDeltaRaw !== null && stockDeltaRaw !== "";

  // Restock mode (atomic increment)
  if (hasStockDelta) {
    const productsCol = await getCollection<Product>("products");
    const now = new Date().toISOString();

    const stockDelta = typeof stockDeltaRaw === "number" ? stockDeltaRaw : Number(stockDeltaRaw);
    if (!Number.isFinite(stockDelta) || stockDelta <= 0) {
      return NextResponse.json({ message: "stockDelta must be a number > 0" }, { status: 400 });
    }

    await productsCol.updateOne(
      { _id: new ObjectId(id) } as any,
      { $inc: { stock: stockDelta }, $set: { updatedAt: now } }
    );

    const updated = await productsCol.findOne({ _id: new ObjectId(id) } as any);
    if (updated && typeof updated.stock === "number" && updated.stock > 0) {
      void checkAndSendRestockNotifications(id, updated.stock);
    }
    return NextResponse.json(updated);
  }

  // General edit mode (mongoose + resolution like POST)
  await connectToDatabase();

  const sportId = (body as any).sport !== undefined ? await resolveIdOrName((body as any).sport, "sport") : null;
  if ((body as any).sport !== undefined && !sportId) {
    return NextResponse.json(
      { message: "Invalid sport. Provide a sport id or existing sport name." },
      { status: 400 }
    );
  }

  const brandId = (body as any).brand !== undefined ? await resolveIdOrName((body as any).brand, "brand") : null;
  if ((body as any).brand !== undefined && !brandId) {
    return NextResponse.json(
      { message: "Invalid brand. Provide a brand id or existing brand name." },
      { status: 400 }
    );
  }

  let equipmentId: string | null = null;
  if ((body as any).equipment !== undefined) {
    equipmentId = await resolveEquipmentId((body as any).equipment, sportId);
    if (!equipmentId) {
      return NextResponse.json(
        {
          message:
            "Invalid equipment. Provide an equipment id or an existing equipment name that belongs to the selected sport.",
        },
        { status: 400 }
      );
    }
  }

  const update: Record<string, unknown> = {};
  const unset: Record<string, unknown> = {};

  if ((body as any).name !== undefined) update.name = typeof (body as any).name === "string" ? (body as any).name.trim() : (body as any).name;
  if ((body as any).description !== undefined) update.description = typeof (body as any).description === "string" ? (body as any).description.trim() : (body as any).description;
  if ((body as any).sku !== undefined) update.sku = typeof (body as any).sku === "string" ? (body as any).sku.trim() : (body as any).sku;
  if (sportId) update.sport = sportId;
  if (brandId) update.brand = brandId;
  if (equipmentId) update.equipment = equipmentId;

  if ((body as any).models !== undefined) update.models = Array.isArray((body as any).models) ? (body as any).models : [];
  if ((body as any).model !== undefined) {
    const m = typeof (body as any).model === "string" ? (body as any).model.trim() : "";
    update.models = m ? [m] : [];
  }

  if ((body as any).price !== undefined) {
    const price = Number((body as any).price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ message: "price must be a number >= 0" }, { status: 400 });
    }
    update.price = price;
  }

  if ((body as any).stock !== undefined) {
    const stock = Number((body as any).stock);
    if (!Number.isFinite(stock) || stock < 0) {
      return NextResponse.json({ message: "stock must be a number >= 0" }, { status: 400 });
    }
    update.stock = stock;
  }

  if ((body as any).isActive !== undefined) update.isActive = Boolean((body as any).isActive);
  if ((body as any).specifications !== undefined) update.specifications = (body as any).specifications ?? {};

  if ((body as any).featureImageKey !== undefined) {
    const key = typeof (body as any).featureImageKey === "string" ? (body as any).featureImageKey.trim() : "";
    if (key) update.featureImageKey = key;
    else unset.featureImageKey = "";
  }

  if ((body as any).imageKeys !== undefined) {
    update.imageKeys = Array.isArray((body as any).imageKeys) ? (body as any).imageKeys : [];
  }

  update.updatedAt = new Date();

  const $set = update;
  const hasUnset = Object.keys(unset).length > 0;

  const updated = await ProductModel.findByIdAndUpdate(
    id,
    hasUnset ? ({ $set, $unset: unset } as any) : ({ $set } as any),
    { new: true }
  ).lean();

  if (!updated) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  if (updated && typeof updated.stock === "number" && updated.stock > 0) {
    void checkAndSendRestockNotifications(id, updated.stock);
  }

  return NextResponse.json(updated);
}

// DELETE /api/products/[id] - delete product
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const productsCol = await getCollection<Product>("products");
  await productsCol.deleteOne({ _id: new ObjectId(id) } as any);

  return NextResponse.json({ success: true });
}
