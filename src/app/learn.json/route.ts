import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { type DayFile, type VocabItem, normalizeArray } from "@/lib/learn";

export async function GET() {
  const dir = path.join(process.cwd(), "public", "learn");
  await fs.mkdir(dir, { recursive: true });

  const files = await fs.readdir(dir).catch(() => []);
  const out: Record<string, VocabItem[]> = {};

  for (const f of files) {
    if (!/^day-\d+\.json$/i.test(f)) continue;
    const filePath = path.join(dir, f);
    const raw = await fs.readFile(filePath, "utf8").catch(() => "");
    if (!raw) continue;

    let json: unknown;
    try { json = JSON.parse(raw); } catch { continue; }

    const key = f.replace(/\.json$/i, "");

    if (json && typeof json === "object" && !Array.isArray(json) && "items" in (json as { items?: unknown })) {
      const df = json as DayFile;
      out[key] = normalizeArray(df.items);
    } else if (Array.isArray(json)) {
      out[key] = normalizeArray(json as unknown[]);
    }
  }

  return NextResponse.json(out);
}