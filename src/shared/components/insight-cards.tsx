"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/shared/components/screen-states";
import type { MonthStat, SeriesPoint } from "@/shared/types/domain";
import { dateOnly } from "@/shared/utils/dates";
import { cn } from "cn";

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];

const TONES = {
  navy: {
    card: "bg-gradient-to-br from-[#163a73] via-[#1d4f91] to-[#0f766e] text-white shadow-lg shadow-blue-950/10",
    icon: "bg-white/15 text-white",
    label: "text-white/80",
    hint: "text-cyan-100",
    value: "text-white",
  },
  blue: {
    card: "bg-gradient-to-br from-sky-50 via-white to-white text-slate-900 ring-1 ring-sky-100",
    icon: "bg-blue-600 text-white",
    label: "text-slate-600",
    hint: "text-blue-700",
    value: "text-slate-950",
  },
  cyan: {
    card: "bg-gradient-to-br from-cyan-50 via-white to-white text-slate-900 ring-1 ring-cyan-100",
    icon: "bg-cyan-600 text-white",
    label: "text-slate-600",
    hint: "text-cyan-800",
    value: "text-slate-950",
  },
  violet: {
    card: "bg-gradient-to-br from-violet-50 via-white to-white text-slate-900 ring-1 ring-violet-100",
    icon: "bg-violet-600 text-white",
    label: "text-slate-600",
    hint: "text-violet-800",
    value: "text-slate-950",
  },
  green: {
    card: "bg-gradient-to-br from-emerald-50 via-white to-white text-slate-900 ring-1 ring-emerald-100",
    icon: "bg-emerald-600 text-white",
    label: "text-slate-600",
    hint: "text-emerald-800",
    value: "text-slate-950",
  },
  orange: {
    card: "bg-gradient-to-br from-orange-50 via-white to-white text-slate-900 ring-1 ring-orange-100",
    icon: "bg-orange-600 text-white",
    label: "text-slate-600",
    hint: "text-orange-800",
    value: "text-slate-950",
  },
} as const;

export type KpiTone = keyof typeof TONES;

export function monthMovement(stats: MonthStat | undefined): string {
  if (!stats?.etiqueta || stats.ultimo === 0) {
    return "Sin movimiento en el último mes con datos";
  }
  return `+${stats.ultimo} en ${stats.etiqueta}`;
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  href,
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  tone: KpiTone;
  href?: string;
  delay?: number;
}) {
  const palette = TONES[tone];
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-sm font-medium", palette.label)}>{label}</p>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", palette.icon)}>
          <Icon className="size-4" aria-hidden={true} />
        </span>
      </div>
      <p className={cn("mt-4 text-3xl font-semibold tracking-tight", palette.value)}>{value}</p>
      {hint ? <p className={cn("mt-1 text-xs font-medium", palette.hint)}>{hint}</p> : null}
    </>
  );
  const className = cn(
    "kpi-rise block rounded-2xl p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2",
    palette.card,
  );
  if (href) {
    return (
      <Link href={href} className={className} style={{ animationDelay: `${delay}ms` }}>
        {body}
      </Link>
    );
  }
  return (
    <article className={className} style={{ animationDelay: `${delay}ms` }}>
      {body}
    </article>
  );
}

function axisLabel(label: string) {
  if (/^\d{4}-\d{2}$/.test(label)) {
    return format(dateOnly(`${label}-01`), "MMM yy", { locale: es });
  }
  return label.length > 28 ? `${label.slice(0, 26)}…` : label;
}

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduce;
}

export function InsightChart({
  title,
  data,
  kind = "bar",
  accent = "bg-[var(--chart-1)]",
  limit,
}: {
  title: string;
  data: SeriesPoint[];
  kind?: "bar" | "horizontal" | "line" | "donut";
  accent?: string;
  limit?: number;
}) {
  const reduce = useReduceMotion();
  const rows = (limit ? data.slice(0, limit) : data).map((point) => ({ ...point, axis: axisLabel(point.label) }));
  const height = kind === "horizontal" ? Math.max(240, rows.length * 36) : 260;
  return (
    <Card className="rounded-2xl shadow-sm ring-foreground/8">
      <div className={cn("h-1", accent)} />
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title="No hay datos para los filtros seleccionados." />
        ) : kind === "donut" ? (
          <div className="grid items-center gap-4 sm:grid-cols-[200px_1fr]">
            <div className="mx-auto h-[200px] w-[200px]">
              <PieChart width={200} height={200}>
                <Pie data={rows} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={58} outerRadius={84} paddingAngle={2} stroke="none" isAnimationActive={!reduce}>
                  {rows.map((point, index) => (
                    <Cell key={point.label} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
            <ul className="grid gap-2">
              {rows.map((point, index) => (
                <li key={point.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: PALETTE[index % PALETTE.length] }} />
                    {point.label}
                  </span>
                  <span className="font-semibold">{point.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              {kind === "line" ? (
                <LineChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.01 255)" />
                  <XAxis dataKey="axis" tick={{ fontSize: 12, fill: "oklch(0.45 0.03 260)" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "oklch(0.45 0.03 260)" }} width={32} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" name="Total" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={!reduce} />
                </LineChart>
              ) : (
                <BarChart data={rows} layout={kind === "horizontal" ? "vertical" : "horizontal"} margin={{ left: kind === "horizontal" ? 8 : 0, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.92 0.01 255)" />
                  {kind === "horizontal" ? (
                    <>
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "oklch(0.45 0.03 260)" }} />
                      <YAxis type="category" dataKey="axis" width={128} tick={{ fontSize: 11, fill: "oklch(0.4 0.03 260)" }} />
                    </>
                  ) : (
                    <>
                      <XAxis
                        dataKey="axis"
                        tick={{ fontSize: 11, fill: "oklch(0.45 0.03 260)" }}
                        interval={0}
                        angle={rows.length > 5 ? -18 : 0}
                        height={rows.length > 5 ? 64 : 32}
                        textAnchor={rows.length > 5 ? "end" : "middle"}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "oklch(0.45 0.03 260)" }} width={32} />
                    </>
                  )}
                  <Tooltip />
                  <Bar dataKey="value" name="Total" radius={6} isAnimationActive={!reduce}>
                    {rows.map((point, index) => (
                      <Cell key={point.label} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
