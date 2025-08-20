import PageHeader from "@/components/PageHeader";
import ToolCard from "@/components/ToolCard";
import { TOOLS } from "@/lib/tools.config";

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Quoc Tool's"
        subtitle="Nhấp vào một thẻ để mở công cụ. Bạn có thể bổ sung tool mới cực dễ bằng cách chỉnh TOOLS config."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {TOOLS.map((t) => (
          <ToolCard key={t.slug} tool={t} />
        ))}
      </div>
    </>
  );
}
