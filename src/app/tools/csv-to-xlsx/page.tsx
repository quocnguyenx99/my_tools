"use client";

import PageHeader from "@/components/PageHeader";
import * as XLSX from "xlsx";
import { useRef, useState } from "react";
import { useToast } from "@/components/Toast";



export default function CsvToXlsxPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string>("");
  const toast = useToast();

  const handleConvert = async (file: File) => {
    setStatus("Đang đọc file CSV...");
    toast.info("Đang xử lý…", "Đọc và chuyển đổi CSV", 1600);
    const text = await file.text();

    setStatus("Đang đọc CSV...");
    const workbook = XLSX.read(text, { type: "string" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");

  const outName = file.name.replace(/\.csv$/i, "") || "converted";
  XLSX.writeFile(wb, `${outName}.xlsx`);
  setStatus("Hoàn tất ✅");
  toast.success("Đã tải xuống", `${outName}.xlsx đã được tạo.`);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f)
      handleConvert(f).catch((err) => {
        const msg = String(err);
        setStatus(`Lỗi: ${msg}`);
        toast.error("Không chuyển đổi được", msg);
      });
  };

  return (
    <div>
      <PageHeader
        title="CSV → XLSX"
        subtitle="Chuyển đổi hoàn toàn trên trình duyệt, không upload server."
      />
      <div className="rounded-xl p-6 bg-[var(--card)] ring-1 ring-white/10">
        <div className="flex flex-col items-start gap-4">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onPick}
            className="block text-sm file:mr-4 file:rounded-lg file:border-0 file:px-4 file:py-2
                     file:bg-blue-600 file:text-white hover:file:bg-blue-700
                     file:cursor-pointer cursor-pointer"
          />
          <p className="text-sm text-[var(--muted)]">
            {status || "Chọn một file .csv để bắt đầu."}
          </p>
        </div>
      </div>
    </div>
  );
}
