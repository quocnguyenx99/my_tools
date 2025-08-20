export type ToolConfig = {
  slug: string; // đường dẫn: /tools/${slug}
  title: string; // tiêu đề card
  description: string; // mô tả ngắn
  accent?: string; // màu viền/nhấn (tuỳ chọn)
};

export const TOOLS: ToolConfig[] = [
  {
    slug: "csv-to-xlsx",
    title: "CSV → XLSX",
    description:
      "Chuyển nhanh file CSV thành Excel (.xlsx) ngay trên trình duyệt.",
    accent: "from-cyan-500 to-blue-500",
  },
  {
    slug: "webp-to-png",
    title: "WEBP → PNG",
    description: "Đổi ảnh WebP sang PNG (lossless) không cần server.",
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    slug: "imgbb-upload",
    title: "Upload ImgBB (multi)",
    description: "Upload 1 hoặc nhiều ảnh lên ImgBB và lấy link công khai.",
    accent: "from-amber-500 to-rose-500",
  },
];

// Gợi ý thêm tool mới:
// TOOLS.push({
//   slug: "your-new-tool",
//   title: "Tên tool",
//   description: "Mô tả ngắn.",
//   accent: "from-emerald-500 to-lime-500",
// });
