import path from "path";
import { promises as fs } from "fs";

export type VocabItem = {
  word: string;
  pronunciation?: string;
  meaningEn?: string;
  meaningVi?: string;
  synonyms?: string[];
  example?: string;
};
export type DayFile = {
  meta: { dateISO: string };
  items: VocabItem[];
};

export function toVocabItem(it: unknown): VocabItem | null {
  if (!it || typeof it !== "object" || Array.isArray(it)) return null;
  const obj = it as Record<string, unknown>;
  const word = typeof obj.word === "string" ? obj.word : undefined;
  if (!word) return null;
  const pronunciation = typeof obj.pronunciation === "string" ? obj.pronunciation : undefined;
  const meaningEn = typeof obj.meaningEn === "string" ? obj.meaningEn : undefined;
  const meaningVi = typeof obj.meaningVi === "string" ? obj.meaningVi : undefined;
  const example = typeof obj.example === "string" ? obj.example : undefined;
  const synRaw = obj.synonyms;
  const synonyms = Array.isArray(synRaw)
    ? (synRaw as unknown[]).filter((s): s is string => typeof s === "string")
    : undefined;
  return { word, pronunciation, meaningEn, meaningVi, synonyms, example };
}

export function normalizeArray(input: unknown): VocabItem[] {
  if (!Array.isArray(input)) return [];
  return (input as unknown[]).map(toVocabItem).filter((x): x is VocabItem => x !== null);
}

export function learnDir() {
  return path.join(process.cwd(), "public", "learn");
}

export async function ensureLearnDir() {
  const dir = learnDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function parseDayNumber(fileName: string) {
  const m = fileName.match(/^day-(\d+)\.json$/i);
  return m ? parseInt(m[1]!, 10) : null;
}