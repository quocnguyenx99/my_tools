"use client";

import React from "react";

export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-sm text-[var(--muted)] mt-2">{subtitle}</p>
      )}
    </div>
  );
}
