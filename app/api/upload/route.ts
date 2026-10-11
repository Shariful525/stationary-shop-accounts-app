import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { uploadBufferToR2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    // Enforce authentication
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "avatars";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file was uploaded." },
        { status: 400 }
      );
    }

    // Limit size (max 8MB for avatars and documents)
    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size exceeds the 8MB limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize filename & create unique key
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
    const uniqueKey = `${folder}/${Date.now()}-${cleanName}`;

    const { fileKey, publicUrl } = await uploadBufferToR2(
      buffer,
      uniqueKey,
      file.type || "application/octet-stream"
    );

    return NextResponse.json({
      success: true,
      fileKey,
      fileUrl: publicUrl,
    });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file to Cloudflare R2." },
      { status: 500 }
    );
  }
}
