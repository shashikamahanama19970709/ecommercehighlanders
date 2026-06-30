import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!productId || !email) {
      return NextResponse.json({ message: "Product ID and Email are required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Please provide a valid email address." }, { status: 400 });
    }

    // Verify product exists and is out of stock
    const productsCol = await getCollection<any>("products");
    const product = await productsCol.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    const notificationsCol = await getCollection<any>("restock_notifications");
    
    // Check if subscription already exists for this product and email (that is active/unnotified)
    const existing = await notificationsCol.findOne({
      productId,
      email,
      notified: { $ne: true }
    });

    if (!existing) {
      await notificationsCol.insertOne({
        productId,
        email,
        notified: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ message: "You have been registered for restock notification!" });
  } catch (error) {
    console.error("Error registering restock notification:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
