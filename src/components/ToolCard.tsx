import Link from "next/link";
import clsx from "clsx";
import type { ToolConfig } from "@/lib/tools.config";

export default function ToolCard({ tool }: { tool: ToolConfig }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className={clsx(
        "group relative rounded-2xl p-5 transition",
        "bg-[var(--card)] hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10",
        "ring-1 ring-white/10"
      )}
    >
      <div
        className={clsx(
          "absolute inset-x-0 -top-0.5 h-0.5 rounded-t-2xl opacity-60",
          "bg-gradient-to-r",
          tool.accent || "from-blue-500 to-cyan-500"
        )}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{tool.title}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{tool.description}</p>
        </div>
        <div className="shrink-0 opacity-60 group-hover:opacity-100 transition">
          ➜
        </div>
      </div>
    </Link>
  );
}
