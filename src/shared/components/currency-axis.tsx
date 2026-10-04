"use client";

import { Tooltip, YAxis } from "recharts";

import { formatCOP, formatCOPCompact } from "@/shared/utils/format";

export function formatChartMoney(value: unknown): string {
  const number = typeof value === "number" ? value : Number(value);
  return formatCOP(Number.isFinite(number) ? number : null);
}

export function CurrencyYAxis() {
  return (
    <YAxis
      tick={{ fontSize: 11 }}
      width={84}
      tickFormatter={(value: number) => formatCOPCompact(value)}
    />
  );
}

export function CurrencyTooltip() {
  return <Tooltip formatter={(value) => formatChartMoney(value)} />;
}
