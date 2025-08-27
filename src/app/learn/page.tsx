import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export default function LearnPage() {
  return (
    <div>
      <PageHeader title="Learn" subtitle="Các công cụ học tập" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          href="/learn/flash-card"
          className="block rounded-xl p-5 bg-[var(--card)] ring-1 ring-white/10 hover:ring-white/20 transition"
        >
          <div className="text-lg font-semibold">Tạo flashcard</div>
          <div className="text-sm text-[var(--muted)] mt-1">
            Quản lý từ vựng theo ngày và học bằng Flashcard.
          </div>
        </Link>
      </div>
    </div>
  );
}
