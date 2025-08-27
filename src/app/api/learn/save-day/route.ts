import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ensureLearnDir, normalizeArray, parseDayNumber, type DayFile, type VocabItem } from "@/lib/learn";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const itemsRaw: unknown = body?.items ?? [];
    const items: VocabItem[] = normalizeArray(itemsRaw);
    if (!items.length) return NextResponse.json({ ok: false, message: "No items" }, { status: 400 });

    const dir = await ensureLearnDir();
    const files = await fs.readdir(dir).catch(() => []);
    let max = 0;
    for (const f of files) {
      const n = parseDayNumber(f);
      if (n && n > max) max = n;
    }
    const next = max + 1;
    const key = `day-${next}`;
    const dateISO = new Date().toISOString().slice(0, 10);

    const data: DayFile = { meta: { dateISO }, items };
    const filePath = path.join(dir, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");

    return NextResponse.json({ ok: true, key, dateISO, count: items.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}