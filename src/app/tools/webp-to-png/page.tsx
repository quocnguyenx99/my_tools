"use client";

import PageHeader from "@/components/PageHeader";
import { useRef, useState } from "react";
import { useToast } from "@/components/Toast";

export default function WebpToPngPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string>("");
  const toast = useToast();

  const convertWebpToPng = async (file: File) => {
    setStatus("Đang đọc ảnh WebP...");
    toast.info("Đang xử lý…", "Đọc và chuyển đổi ảnh", 1600);
    const url = URL.createObjectURL(file);

    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas context not available");
          ctx.drawImage(img, 0, 0);

          setStatus("Đang xuất PNG...");
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Không thể tạo blob PNG."));
                return;
              }
              const a = document.createElement("a");
              const outName = file.name.replace(/\.webp$/i, "") || "converted";
              a.href = URL.createObjectURL(blob);
              a.download = `${outName}.png`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(a.href);
              toast.success("Đã tải xuống", `${outName}.png đã được tạo.`);
              resolve();
            },
            "image/png",
            1.0
          );
        } catch (e) {
          reject(e);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () =>
        reject(new Error("Không thể tải ảnh WebP. File có hợp lệ không?"));
      img.src = url;
    });

    setStatus("Hoàn tất ✅");
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f)
      convertWebpToPng(f).catch((err) => {
        const msg = String(err);
        setStatus(`Lỗi: ${msg}`);
        toast.error("Không chuyển đổi được", msg);
      });
  };

  return (
    <div>
      <PageHeader
        title="WEBP → PNG"
        subtitle="Chuyển đổi ngay trong trình duyệt, không cần upload."
      />
      <div className="rounded-xl p-6 bg-[var(--card)] ring-1 ring-white/10">
        <div className="flex flex-col items-start gap-4">
          <input
            ref={inputRef}
            type="file"
            accept=".webp,image/webp"
            onChange={onPick}
            className="block text-sm file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2
                     file:bg-fuchsia-600 file:text-white hover:file:bg-fuchsia-700
                     file:cursor-pointer cursor-pointer"
          />
          <p className="text-sm text-[var(--muted)]">
            {status || "Chọn một ảnh .webp để bắt đầu."}
          </p>
        </div>
      </div>
    </div>
  );
}
