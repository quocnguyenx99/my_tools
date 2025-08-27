import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { ensureLearnDir, parseDayNumber, type DayFile, type VocabItem } from "@/lib/learn";

export async function GET() {
  const dir = await ensureLearnDir();
  const files = await fs.readdir(dir).catch(() => []);
  const days: { key: string; dateISO: string; items: VocabItem[] }[] = [];

  for (const f of files) {
    if (!/^day-\d+\.json$/i.test(f)) continue;
    const filePath = path.join(dir, f);
    const raw = await fs.readFile(filePath, "utf8").catch(() => "");
    if (!raw) continue;

    let json: unknown;
    try { json = JSON.parse(raw); } catch { continue; }

    const dayNum = parseDayNumber(f);
    const key = `day-${dayNum ?? "?"}`;

    if (json && typeof json === "object" && "items" in (json as Partial<DayFile>)) {
      const df = json as DayFile;
      days.push({ key, dateISO: df.meta?.dateISO ?? "", items: Array.isArray(df.items) ? df.items : [] });
    } else if (Array.isArray(json)) {
      days.push({ key, dateISO: "", items: json as VocabItem[] });
    }
  }

  days.sort((a, b) => {
    const na = parseInt(a.key.replace("day-", ""), 10) || 0;
    const nb = parseInt(b.key.replace("day-", ""), 10) || 0;
    return na - nb;
  });

  return NextResponse.json({ days });
}