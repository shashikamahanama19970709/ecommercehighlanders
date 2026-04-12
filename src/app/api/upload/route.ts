import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const b2Endpoint = process.env.B2_ENDPOINT; // e.g. https://s3.us-west-002.backblazeb2.com
const b2Bucket = process.env.B2_BUCKET_NAME;
const b2Region = process.env.B2_REGION || "us-west-002";
const b2KeyId = process.env.B2_KEY_ID;
const b2AppKey = process.env.B2_APPLICATION_KEY;

const s3Client =
  b2Endpoint && b2Bucket && b2KeyId && b2AppKey &&
  !b2Endpoint.includes('YOUR-REGION') && !b2Bucket.includes('your-bucket')
    ? new S3Client({
        region: b2Region,
        endpoint: b2Endpoint,
        credentials: {
          accessKeyId: b2KeyId,
          secretAccessKey: b2AppKey,
        },
        forcePathStyle: true,
      })
    : null;

// Use Backblaze B2 only, no local fallback
const useB2 = !!s3Client;

export const runtime = "nodejs";

// POST /api/upload - upload a single image file to Backblaze B2 private bucket
export async function POST(request: NextRequest) {
  console.log("Upload request received");
  console.log("Content-Type:", request.headers.get("content-type"));
  console.log("Content-Length:", request.headers.get("content-length"));

  if (!useB2) {
    return NextResponse.json({ message: "Backblaze B2 not configured" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: "File size must be less than 10MB" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: "Only image files are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    
    // Get folder from form data, default to 'products' for backward compatibility
    const folder = formData.get("folder") as string || "products";
    const key = `${folder}/${filename}`;

    console.log("Attempting to upload to Backblaze B2:", { bucket: b2Bucket, key });

    await s3Client!.send(
      new PutObjectCommand({
        Bucket: b2Bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        // No ACL for private bucket
      }),
    );

    // Generate signed URL for preview (expires in 1 hour)
    const signedUrl = await getSignedUrl(
      s3Client!,
      new GetObjectCommand({
        Bucket: b2Bucket,
        Key: key,
      }),
      { expiresIn: 3600 } // 1 hour
    );

    console.log("B2 upload successful, signed URL generated");
    return NextResponse.json({ key, signedUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({
      message: "Error uploading file",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
