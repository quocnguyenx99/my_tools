"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useCallback, useEffect, useState } from "react";

type VocabItem = {
  word: string;
  pronunciation?: string;
  meaningEn?: string;
  meaningVi?: string;
  synonyms?: string[];
  example?: string;
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

export default function FlashCardDayPage() {
  const params = useParams<{ day: string }>();
  const router = useRouter();
  const day = params.day; // ví dụ: 'day-1'

  const [cards, setCards] = useState<VocabItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);

  // Prefer per-day API, fallback to legacy aggregator
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/learn/get?day=${encodeURIComponent(day)}`, { cache: "no-store" });
        if (res.ok) {
          const js = await res.json();
          if (js?.ok && Array.isArray(js.items)) {
            setCards(js.items as VocabItem[]);
            setIdx(0);
            setShowBack(false);
            return;
          }
        }
      } catch {}
      // Fallback: /learn.json aggregator
      fetch("/learn.json")
        .then((r) => (r.ok ? r.json() : {}))
        .then((json: unknown) => {
          if (json && typeof json === "object" && !Array.isArray(json)) {
            const byKey = (json as Record<string, unknown>)[day as unknown as string];
            if (byKey !== undefined) {
              const arr = Array.isArray(byKey) ? byKey : byKey && typeof byKey === "object" ? [byKey] : [];
              const normalized = (arr as unknown[])
                .map(toVocabItem)
                .filter((x): x is VocabItem => x !== null);
              setCards(normalized);
              setIdx(0);
              setShowBack(false);
              return;
            }
          }
          if (Array.isArray(json)) {
            const normalized = (json as unknown[])
              .map(toVocabItem)
              .filter((x): x is VocabItem => x !== null);
            setCards(normalized);
            setIdx(0);
            setShowBack(false);
            return;
          }
          setCards([]);
          setIdx(0);
          setShowBack(false);
        })
        .catch(() => {
          setCards([]);
          setIdx(0);
          setShowBack(false);
        });
    };
    load();
  }, [day]);

  const prev = useCallback(() => {
    setIdx((i) => {
      if (i > 0) {
        setShowBack(false);
        return i - 1;
      }
      return i;
    });
  }, []);

  const next = useCallback(() => {
    setIdx((i) => {
      if (i < cards.length - 1) {
        setShowBack(false);
        return i + 1;
      } else {
        // học xong → quay về danh sách
        router.push("/learn/flash-card");
        return i;
      }
    });
  }, [cards.length, router]);

  // Hỗ trợ phím mũi tên trái/phải và Space để flip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key.toLowerCase() === " ") {
        e.preventDefault();
        setShowBack((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  const cur = cards[idx];

  if (!cards.length) {
    return (
      <div>
        <PageHeader title={`Flashcard - ${day}`} subtitle="Không có dữ liệu" />
        <Link href="/learn/flash-card" className="underline text-sm">← Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <PageHeader title={`Flashcard - ${day}`} subtitle={`${idx + 1}/${cards.length}`} />
        <Link href="/learn/flash-card" className="text-sm underline">← Quay lại danh sách</Link>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          marginInline: "auto",
          maxWidth: 720,
        }}
      >
        <button
          className="flash-nav-btn"
          onClick={prev}
          disabled={idx === 0}
          aria-label="Previous card"
          title="Trước"
        >
          ◀
        </button>

        <div
          className="flashcard"
          onClick={() => setShowBack(!showBack)}
          role="button"
          aria-label="Flip card"
          title="Nhấn để lật thẻ"
        >
          {!showBack ? (
            <div className="face front">
              <div className="word">{cur.word}</div>
              {cur.pronunciation && <div className="pron">{cur.pronunciation}</div>}
              <div className="hint">Nhấn để lật thẻ</div>
            </div>
          ) : (
            <div className="face back">
              {cur.pronunciation && (
                <div className="row">
                  <span className="label">Phát âm</span>
                  <span>{cur.pronunciation}</span>
                </div>
              )}
              {cur.meaningVi && (
                <div className="row">
                  <span className="label">Nghĩa (VI)</span>
                  <span className="strong">{cur.meaningVi}</span>
                </div>
              )}
              {cur.meaningEn && (
                <div className="row">
                  <span className="label">Nghĩa (EN)</span>
                  <span>{cur.meaningEn}</span>
                </div>
              )}
              {Array.isArray(cur.synonyms) && cur.synonyms.length > 0 && (
                <div className="row">
                  <span className="label">Synonyms</span>
                  <span className="chips">
                    {cur.synonyms.map((s, i) => (
                      <span className="chip" key={i}>{s}</span>
                    ))}
                  </span>
                </div>
              )}
              {cur.example && (
                <div className="row">
                  <span className="label">Ví dụ</span>
                  <span className="example">“{cur.example}”</span>
                </div>
              )}
              <div className="hint">Nhấn để lật lại mặt A</div>
            </div>
          )}
        </div>

        <button
          className="flash-nav-btn primary"
          onClick={next}
          aria-label={idx < cards.length - 1 ? "Next card" : "Finish"}
          title={idx < cards.length - 1 ? "Sau" : "Hoàn tất"}
        >
          {idx < cards.length - 1 ? "▶" : "✓"}
        </button>
      </div>
    </div>
  );
}
