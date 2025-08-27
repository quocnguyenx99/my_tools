import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { learnDir } from "@/lib/learn";

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const day = searchParams.get("day");
  if (!day) return NextResponse.json({ ok: false }, { status: 400 });
  const filePath = path.join(learnDir(), `${day}.json`);
  try {
    await fs.unlink(filePath);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 404 });
  }
}