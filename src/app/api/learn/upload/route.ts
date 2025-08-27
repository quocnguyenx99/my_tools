import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
    }

    const text = await file.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    // Lưu vào public/learn.json để client có thể fetch trực tiếp
    const outPath = path.join(process.cwd(), "public", "learn.json");
    await fs.writeFile(outPath, JSON.stringify(json, null, 2), "utf8");

    return NextResponse.json({ ok: true, path: "/learn.json" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
