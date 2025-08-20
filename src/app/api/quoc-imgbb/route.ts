import { NextRequest, NextResponse } from "next/server";

const IMGBB_ENDPOINT = "https://api.imgbb.com/1/upload";

export async function POST(req: NextRequest) {
  try {
    // Sử dụng key riêng cho Quốc
    const apiKey = process.env.IMGBB_API_KEY_QUOC;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing IMGBB_API_KEY_QUOC" }, { status: 500 });
    }

    // Nhận multipart/form-data: một file "image"
    const form = await req.formData();
    const file = form.get("image") as File | null;
    const name = (form.get("name") as string) || undefined;
    const expiration = (form.get("expiration") as string) || process.env.IMGBB_EXPIRATION || "0";

    if (!file) {
      return NextResponse.json({ error: "No file provided (field 'image')" }, { status: 400 });
    }

    const upstream = new FormData();
    upstream.append("key", apiKey);
    if (expiration) upstream.append("expiration", expiration);
    if (name) upstream.append("name", name.replace(/\.[a-z0-9]+$/i, ""));
    upstream.append("image", file, file.name);

    const resp = await fetch(IMGBB_ENDPOINT, { method: "POST", body: upstream });
    const json = await resp.json();

    if (!resp.ok || !json?.success) {
      return NextResponse.json({ success: false, error: json?.error || "Upload failed" }, { status: 200 });
    }

    const d = json.data;
    return NextResponse.json({
      success: true,
      data: {
        id: d.id,
        name: name || file.name,
        width: d.width,
        height: d.height,
        size: d.size,
        url: d.url,
        display_url: d.display_url,
        url_viewer: d.url_viewer,
        delete_url: d.delete_url,
        thumb_url: d?.thumb?.url || null,
        medium_url: d?.medium?.url || null,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
