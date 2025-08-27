"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type VocabItem = {
  word: string;
  pronunciation?: string;
  meaningEn?: string;
  meaningVi?: string;
  synonyms?: string[];
  example?: string;
};

type DayGroup = {
  key: string;        // day-1
  dateISO: string;    // 2025-08-26
  items: VocabItem[];
};

function toVocabItem(it: unknown): VocabItem | null {
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

export default function FlashCardIndexPage() {
  const [days, setDays] = useState<DayGroup[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  async function loadDays() {
    const res = await fetch("/api/learn/list", { cache: "no-store" });
    const json = await res.json();
    const arr: DayGroup[] = json?.days ?? [];
    setDays(arr);
    setOpen((prev) => {
      const next = { ...prev };
      for (const d of arr) if (!(d.key in next)) next[d.key] = true;
      return next;
    });
  }

  useEffect(() => {
    loadDays().catch(() => {});
  }, []);

  async function onImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = e.currentTarget;
    try {
      const file = inputEl.files?.[0];
      if (!file) return;
      const text = await file.text();
      let raw: unknown;
      try {
        raw = JSON.parse(text);
      } catch {
        alert("File JSON không hợp lệ.");
        return;
      }
      const items: VocabItem[] = Array.isArray(raw)
        ? (raw as unknown[]).map(toVocabItem).filter((x): x is VocabItem => x !== null)
        : [];
      if (!items.length) {
        alert("Không tìm thấy mục từ vựng hợp lệ.");
        return;
      }
      const res = await fetch("/api/learn/save-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const js = await res.json();
      if (!js?.ok) {
        alert("Lưu ngày học thất bại.");
        return;
      }
      await loadDays();
    } catch (err) {
      console.error(err);
      alert("Import thất bại.");
    } finally {
      if (inputEl) inputEl.value = "";
    }
  }

  async function onDeleteDay(dayKey: string) {
    if (!confirm(`Xóa toàn bộ từ vựng của ${dayKey}?`)) return;
    const res = await fetch(`/api/learn/delete?day=${encodeURIComponent(dayKey)}`, { method: "DELETE" });
    const js = await res.json();
    if (!js?.ok) {
      alert("Xóa thất bại.");
      return;
    }
    await loadDays();
  }

  const total = useMemo(() => days.reduce((s, d) => s + d.items.length, 0), [days]);
  const firstKey = days.length > 0 ? days[0]!.key : null;

  return (
    <>
      <PageHeader
        title="Flashcard"
        actions={
          <div
            className="row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={onImportJson}
            />
            <button
              className="btn btn-upload"
              onClick={() => fileRef.current?.click()}
              aria-label="Import JSON từ vựng"
              title="Import JSON từ vựng"
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {/* upload icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4.001 4a1 1 0 0 1-1.412 0l-4.001-4a1 1 0 1 1 1.414-1.414L11 12.586V4a1 1 0 0 1 1-1z"></path>
                <path d="M4 15a1 1 0 0 1 1 1v2h14v-2a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z"></path>
              </svg>
              Import JSON từ vựng
            </button>
            <button
              className="btn btn-primary"
              onClick={() => firstKey && router.push(`/learn/flash-card/${firstKey}`)}
              disabled={!firstKey}
              title="Học bằng flashcard từ ngày đầu tiên"
            >
              Học bằng flashcard
            </button>
          </div>
        }
      />

      <div style={{ marginBottom: 12, color: "#555" }}>{total} từ vựng</div>

      {days.map((g) => {
        const isOpen = !!open[g.key];
        const title = g.dateISO ? `Ngày học ${g.dateISO}` : `${g.key}`;
        return (
          <div key={g.key} style={{ marginBottom: 16, border: "1px solid #e8e8e8", borderRadius: 8, background: "#fff" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: "linear-gradient(90deg, #e9f5ff, #f7fbff)",
                borderBottom: "1px solid #e8f4ff",
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  className="btn"
                  onClick={() => setOpen((prev) => ({ ...prev, [g.key]: !prev[g.key] }))}
                  title={isOpen ? "Thu gọn" : "Mở rộng"}
                >
                  {isOpen ? "▼" : "►"}
                </button>
                <strong>{title}</strong>
                <span style={{ color: "#666" }}>({g.items.length} từ)</span>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <Link href={`/learn/flash-card/${g.key}`} className="btn btn-primary">
                  Học Flashcard
                </Link>
                <button className="btn btn-danger" onClick={() => onDeleteDay(g.key)}>
                  Delete
                </button>
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: 12, overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Từ vựng</th>
                      <th>Phát âm</th>
                      <th>Nghĩa (EN)</th>
                      <th>Nghĩa (VN)</th>
                      <th>Synonyms</th>
                      <th>Ví dụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((it, i) => (
                      <tr key={i}>
                        <td className="td-strong">{it.word}</td>
                        <td className="td-subtle">{it.pronunciation ?? ""}</td>
                        <td>{it.meaningEn ?? ""}</td>
                        <td>{it.meaningVi ?? ""}</td>
                        <td className="td-syn">
                          {Array.isArray(it.synonyms) ? it.synonyms.join(", ") : ""}
                        </td>
                        <td className="td-example">{it.example ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
