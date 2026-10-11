import { NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/r2";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await context.params;
    const fileKey = Array.isArray(key) ? key.join("/") : key;

    if (!fileKey) {
      return new NextResponse("File key missing", { status: 400 });
    }

    const data = await getR2Object(fileKey);
    if (!data.Body) {
      return new NextResponse("File not found", { status: 404 });
    }

    const bodyStream = (data.Body as any).transformToWebStream
      ? (data.Body as any).transformToWebStream()
      : (data.Body as any);

    return new Response(bodyStream, {
      headers: {
        "Content-Type": data.ContentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      return new NextResponse("Not Found", { status: 404 });
    }
    console.error("Error serving R2 object:", error);
    return new NextResponse("Failed to load file", { status: 500 });
  }
}
