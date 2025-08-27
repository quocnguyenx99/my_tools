import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ensureLearnDir, normalizeArray, type DayFile, type VocabItem } from "@/lib/learn";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day");
    if (!day) return NextResponse.json({ ok: false, message: "Missing day" }, { status: 400 });

    const dir = await ensureLearnDir();
    const filePath = path.join(dir, `${day}.json`);
    const raw = await fs.readFile(filePath, "utf8").catch(() => null);
    if (!raw) return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });

    let json: unknown;
    try { json = JSON.parse(raw); } catch { return NextResponse.json({ ok: false, message: "Bad JSON" }, { status: 500 }); }

    let items: VocabItem[] = [];
    let dateISO = "";
    if (json && typeof json === "object" && !Array.isArray(json) && "items" in (json as { items?: unknown })) {
      const df = json as DayFile;
      items = normalizeArray(df.items);
      dateISO = df.meta?.dateISO ?? "";
    } else if (Array.isArray(json)) {
      items = normalizeArray(json as unknown[]);
    }

    return NextResponse.json({ ok: true, key: day, dateISO, items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
