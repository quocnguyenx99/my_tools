"use client";

import PageHeader from "@/components/PageHeader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/Toast";

type FileItem = {
  file: File;
  id: string; // local id
  name: string;
  size: number;
  status: "queued" | "uploading" | "processing" | "done" | "error";
  progress: number; // 0..100 (client->server)
  result?: {
    url?: string;
    display_url?: string;
    url_viewer?: string;
    delete_url?: string;
    thumb_url?: string | null;
    medium_url?: string | null;
  };
  error?: string;
};

const MAX_SIZE = 32 * 1024 * 1024; // 32MB
const CONCURRENCY = 3;
const ALBUM_URL = "https://ibb.co/album/N6Tp2J";

export default function ImgbbUploadPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<FileItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const toast = useToast();

  // Helpers
  const addFiles = useCallback((files: File[]) => {
    const normalized = files
      .filter((f) => f.size <= MAX_SIZE)
      .map((f) => ({
        file: f,
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        status: "queued" as const,
        progress: 0,
      }));
    const overLimit = files.filter((f) => f.size > MAX_SIZE);
    if (overLimit.length) {
      setMsg(`Có ${overLimit.length} file vượt 32MB và đã bị bỏ qua.`);
    }
    setItems((prev) => [...prev, ...normalized]);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    addFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Drag & Drop
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;
    const prevent = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDrop = (e: DragEvent) => {
      prevent(e);
      if (e.dataTransfer?.files?.length) {
        addFiles(Array.from(e.dataTransfer.files));
      }
    };
    el.addEventListener("dragenter", prevent);
    el.addEventListener("dragover", prevent);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragenter", prevent);
      el.removeEventListener("dragover", prevent);
      el.removeEventListener("drop", onDrop);
    };
  }, [addFiles]);

  // Paste (Ctrl+V)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const files = Array.from(e.clipboardData.files || []);
      if (files.length) addFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const queuedCount = useMemo(
    () => items.filter((i) => i.status === "queued").length,
    [items]
  );
  // number of files currently uploading/processing
  const doneCount = useMemo(
    () => items.filter((i) => i.status === "done").length,
    [items]
  );

  // Upload 1 file (XMLHttpRequest để có progress)
  const uploadOne = useCallback((item: FileItem) => {
    return new Promise<FileItem>((resolve) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("image", item.file, item.name);
      form.append("name", item.name);
      // Nếu muốn ép thời gian tự xoá cho file này:
      // form.append("expiration", "0");

      // progress client -> server
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setItems((prev) =>
            prev.map((x) =>
              x.id === item.id
                ? { ...x, progress: pct, status: "uploading" }
                : x
            )
          );
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 2) {
          // Headers received -> coi như đã upload xong phía client, server đang xử lý
          setItems((prev) =>
            prev.map((x) =>
              x.id === item.id
                ? { ...x, status: "processing", progress: 100 }
                : x
            )
          );
        }
      };

      xhr.onload = () => {
        try {
          const resp = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300 && resp?.success) {
            const d = resp.data;
            const updated: FileItem = {
              ...item,
              status: "done",
              progress: 100,
              result: {
                url: d.url,
                display_url: d.display_url,
                url_viewer: d.url_viewer,
                delete_url: d.delete_url,
                thumb_url: d.thumb_url,
                medium_url: d.medium_url,
              },
            };
            setItems((prev) =>
              prev.map((x) => (x.id === item.id ? updated : x))
            );
            // toast success for single file
            try {
              toast.success("Upload thành công", item.name);
            } catch {
              // ignore
            }
            resolve(updated);
          } else {
            const updated: FileItem = {
              ...item,
              status: "error",
              error: resp?.error || "Upload failed",
            };
            setItems((prev) =>
              prev.map((x) => (x.id === item.id ? updated : x))
            );
            resolve(updated);
          }
  } catch (err: unknown) {
          let errorMsg = "Parse error";
          if (
            err &&
            typeof err === "object" &&
            "message" in err &&
            typeof (err as { message?: string }).message === "string"
          ) {
            errorMsg = (err as { message: string }).message;
          }
          const updated: FileItem = {
            ...item,
            status: "error",
            error: errorMsg,
          };
          setItems((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
          resolve(updated);
        }
      };

      xhr.onerror = () => {
        const updated: FileItem = {
          ...item,
          status: "error",
          error: "Network error",
        };
        setItems((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
        resolve(updated);
      };

    xhr.open("POST", "/api/imgbb");
      xhr.send(form);
    });
  }, [toast]);

  // Runner: giới hạn song song (CONCURRENCY)
  const runUpload = useCallback(async () => {
    if (!items.some((i) => i.status === "queued")) {
      setMsg("Không có file nào trong hàng đợi.");
      return;
    }
    setBusy(true);
    setMsg("Đang upload...");

    let active = 0;
    let idx = 0;

    const queue = [...items]; // bản sao
    const next = async () => {
      while (active < CONCURRENCY && idx < queue.length) {
        const it = queue[idx++];
        if (it.status !== "queued") continue;
        active++;
        uploadOne(it).finally(() => {
          active--;
          next();
        });
      }
    };

    await new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        const anyRunning = items.some(
          (i) =>
            i.status === "uploading" ||
            i.status === "processing" ||
            i.status === "queued"
        );
        if (!anyRunning) {
          clearInterval(timer);
          resolve();
        }
      }, 250);
      next();
    });

    setBusy(false);
    setMsg("Hoàn tất ✅");
  }, [items, uploadOne]);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((x) => x.id !== id));
  const clearAll = () => setItems([]);
  const clearDone = () =>
    setItems((prev) => prev.filter((x) => x.status !== "done"));

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      try {
        toast.success("Đã copy", text, 1800);
      } catch {}
      setMsg("Đã copy ✅");
    } catch {
      try {
        toast.error("Không copy được", "Hãy copy thủ công", 3000);
      } catch {}
      setMsg("Không thể copy tự động, hãy copy thủ công.");
    }
  };
  const exportLinks = (picker: (i: FileItem) => string | undefined) => {
    const lines = items
      .filter((i) => i.status === "done")
      .map(picker)
      .filter(Boolean) as string[];
    copy(lines.join("\n"));
  };

  return (
    <div>
      <PageHeader
        title="Upload ImgBB (multi)"
        subtitle="Kéo-thả / chọn / dán ảnh → upload song song (giới hạn), có hiển thị tiến độ từng file và link công khai."
      />

      <div className="rounded-xl p-6 bg-[var(--card)] ring-1 ring-white/10 space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onInputChange}
            disabled={busy}
            className="block text-sm file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2
                       file:bg-amber-600 file:text-white hover:file:bg-amber-700
                       file:cursor-pointer cursor-pointer disabled:opacity-60"
          />
          <button
            onClick={runUpload}
            disabled={busy || !items.some((i) => i.status === "queued")}
            className="px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            Bắt đầu upload ({queuedCount} chờ)
          </button>
          <button
            onClick={clearDone}
            className="px-3 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-800"
          >
            Ẩn file đã xong
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-2 text-sm rounded-lg bg-rose-700 hover:bg-rose-800"
          >
            Xoá tất cả
          </button>

          <a
            href={ALBUM_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-xs underline opacity-80 hover:opacity-100"
          >
            Mở album ImgBB
          </a>
        </div>

        {/* Dropzone */}
        <div
          ref={dropRef}
          className="rounded-lg border border-dashed border-white/20 p-6 text-center opacity-90 hover:opacity-100
                     transition bg-black/20"
        >
          <div className="text-sm">
            Kéo & thả ảnh vào đây, hoặc{" "}
            <span className="underline">Ctrl/⌘+V</span> để dán.
          </div>
          <div className="text-xs text-[var(--muted)] mt-1">
            Giới hạn: 32MB/ảnh. Upload song song: {CONCURRENCY}.
          </div>
        </div>

        <p className="text-sm text-[var(--muted)]">
          {busy ? "Đang xử lý..." : msg || "Thêm ảnh để bắt đầu."}
        </p>

        {/* Danh sách file */}
        {items.length > 0 && (
          <ul className="space-y-3">
            {items.map((it) => (
              <li
                key={it.id}
                className="p-3 rounded-lg bg-black/20 ring-1 ring-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {(it.size / 1024).toFixed(1)} KB
                      {" · "}
                      <span
                        className={
                          it.status === "done"
                            ? "text-emerald-400"
                            : it.status === "error"
                            ? "text-rose-400"
                            : it.status === "processing"
                            ? "text-amber-300"
                            : it.status === "uploading"
                            ? "text-blue-300"
                            : "text-slate-300"
                        }
                      >
                        {it.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {it.status === "uploading" || it.status === "processing" ? (
                      <div className="w-40 h-2 bg-white/10 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${it.progress}%` }}
                        />
                      </div>
                    ) : it.status === "done" ? (
                      <span className="text-xs text-emerald-400">100%</span>
                    ) : it.status === "error" ? (
                      <span className="text-xs text-rose-400">{it.error}</span>
                    ) : null}

                    <button
                      onClick={() => removeItem(it.id)}
                      disabled={
                        it.status === "uploading" || it.status === "processing"
                      }
                      className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-800 disabled:opacity-40"
                    >
                      Xoá
                    </button>
                  </div>
                </div>

                {it.status === "done" && it.result && (
                  <div className="mt-2 text-sm flex items-center gap-2">
                    <div className="truncate text-xs text-[var(--muted)]">Direct URL:</div>
                    <a
                      className="truncate underline text-sm"
                      href={it.result.url!}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {it.result.url}
                    </a>
                    <button
                      onClick={() => copy(it.result!.url!)}
                      className="ml-auto px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-800"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Export links */}
        {doneCount > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportLinks((i) => i.result?.url)}
              className="px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              Copy tất cả Direct URL
            </button>
            <button
              onClick={() => exportLinks((i) => i.result?.display_url)}
              className="px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700"
            >
              Copy tất cả Display URL
            </button>
            <button
              onClick={() => exportLinks((i) => i.result?.url_viewer)}
              className="px-3 py-2 text-sm rounded-lg bg-slate-600 hover:bg-slate-700"
            >
              Copy tất cả Viewer URL
            </button>
            <button
              onClick={() => exportLinks((i) => i.result?.delete_url)}
              className="px-3 py-2 text-sm rounded-lg bg-rose-600 hover:bg-rose-700"
            >
              Copy tất cả Delete URL
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-[var(--muted)]">
        Lưu ý: ImgBB API hiện chưa có tham số để đưa ảnh trực tiếp vào album.
        Hãy dùng UI ImgBB để sắp xếp vào album sau khi upload.
      </div>
    </div>
  );
}
