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

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    // Validate file type
    if (!isImage && !isVideo) {
      return NextResponse.json({ message: "Only image or video files are allowed" }, { status: 400 });
    }

    // Validate file size
    const maxSizeBytes = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { message: isVideo ? "Video size must be less than 50MB" : "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Basic allow-list for common video types
    if (isVideo) {
      const allowed = new Set(["video/mp4", "video/webm", "video/ogg", "video/quicktime"]);
      if (!allowed.has(file.type)) {
        return NextResponse.json({ message: "Unsupported video type" }, { status: 400 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
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

// GET /api/upload?key=... - retrieve and proxy file from Backblaze B2 private bucket
export async function GET(request: NextRequest) {
  if (!useB2) {
    return new Response("Backblaze B2 not configured", { status: 500 });
  }

  const key = request.nextUrl.searchParams.get("key");
  if (!key) {
    return new Response("Missing key parameter", { status: 400 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: b2Bucket,
      Key: key,
    });

    const response = await s3Client!.send(command);
    const body = response.Body;

    if (!body) {
      return new Response("File body is empty", { status: 404 });
    }

    // Set cache headers to cache this proxy response for 1 year
    const headers = new Headers();
    headers.set("Content-Type", response.ContentType || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(body as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Error proxying file from B2:", error);
    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
      return new Response("File not found", { status: 404 });
    }
    return new Response("Error retrieving file", { status: 500 });
  }
}
