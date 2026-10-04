"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/shared/lib/api-client";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { FinancePayload } from "@/shared/types/domain";
import { FUENTE_DEMO, indicatorViews, type IndicatorGroup, type IndicatorView } from "@/server/services/financial-indicators";
import { formatCOP, formatCOPCompact, formatDate, formatNumber } from "@/shared/utils/format";

const GROUPS: IndicatorGroup[] = ["Liquidez", "Endeudamiento", "Rentabilidad", "Cobertura", "Crecimiento"];

export function FinancePanel({ companyId }: { companyId: string }) {
  const query = useQuery({
    queryKey: ["company", companyId, "finanzas"],
    queryFn: async () => {
      const { data } = await apiClient.get<FinancePayload>(`/api/empresas/${companyId}/finanzas`);
      return data;
    },
  });

  if (query.isLoading) {
    return <LoadingBlock rows={4} />;
  }
  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }
  if (query.data.periodos.length === 0) {
    return <EmptyState title="Sin información financiera disponible" />;
  }

  const latest = query.data.periodos[query.data.periodos.length - 1];
  const previous = query.data.periodos.length >= 2 ? query.data.periodos[query.data.periodos.length - 2] : null;
  if (!latest) {
    return <EmptyState title="Sin información financiera disponible" />;
  }

  const views = indicatorViews(latest.indicadores, previous?.indicadores ?? null, previous?.year ?? null);
  const chart = query.data.periodos.map((period) => ({
    year: String(period.year),
    ingresos: period.revenue,
    activos: period.totalAssets,
    patrimonio: period.equity,
    utilidad: period.netProfit,
  }));
  const statement: [string, string][] = [
    ["Fecha de corte", formatDate(latest.cutoffDate)],
    ["Ingresos", formatCOP(latest.revenue)],
    ["Activo corriente", formatCOP(latest.currentAssets)],
    ["Activo total", formatCOP(latest.totalAssets)],
    ["Pasivo corriente", formatCOP(latest.currentLiabilities)],
    ["Pasivo total", formatCOP(latest.totalLiabilities)],
    ["Patrimonio", formatCOP(latest.equity)],
    ["Utilidad operacional", formatCOP(latest.operatingProfit)],
    ["Gastos de interés", formatCOP(latest.interestExpense)],
    ["EBITDA", formatCOP(latest.ebitda)],
    ["Utilidad neta", formatCOP(latest.netProfit)],
    ["Empleados", formatNumber(latest.employees)],
  ];

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Resumen financiero</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Ingresos" value={formatCOPCompact(latest.revenue)} detail={formatCOP(latest.revenue)} />
          <Metric label="Activos" value={formatCOPCompact(latest.totalAssets)} detail={formatCOP(latest.totalAssets)} />
          <Metric label="Patrimonio" value={formatCOPCompact(latest.equity)} detail={formatCOP(latest.equity)} />
          <Metric label="Utilidad" value={formatCOPCompact(latest.netProfit)} detail={formatCOP(latest.netProfit)} />
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Evolución financiera</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={88} tickFormatter={(value: number) => formatCOPCompact(value)} />
                  <Tooltip formatter={(value) => formatCOP(typeof value === "number" ? value : Number(value))} />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos" fill="var(--chart-1)" radius={4} />
                  <Line type="monotone" dataKey="activos" name="Activos" stroke="var(--chart-2)" strokeWidth={2} />
                  <Line type="monotone" dataKey="patrimonio" name="Patrimonio" stroke="var(--chart-4)" strokeWidth={2} />
                  <Line type="monotone" dataKey="utilidad" name="Utilidad" stroke="var(--chart-3)" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Información financiera</h2>
        <p className="text-sm text-muted-foreground">Periodo {latest.year} · corte {formatDate(latest.cutoffDate)}</p>
        <div className="overflow-hidden rounded-xl border bg-card">
          <dl>
            {statement.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b px-4 py-2.5 text-sm last:border-0">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                {["Año", "Corte", "Ingresos", "Activo corriente", "Activo total", "Pasivo corriente", "Pasivo total", "Patrimonio", "Utilidad operacional", "Gastos de interés", "Utilidad neta", "Empleados"].map((label) => (
                  <th key={label} className="px-3 py-2 font-medium">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {query.data.periodos.map((period) => (
                <tr key={period.year} className="border-b last:border-0">
                  <td className="px-3 py-2">{period.year}</td>
                  <td className="px-3 py-2">{formatDate(period.cutoffDate)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCOP(period.revenue)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCOP(period.currentAssets)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCOP(period.totalAssets)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCOP(period.currentLiabilities)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCOP(period.totalLiabilities)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCOP(period.equity)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCOP(period.operatingProfit)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCOP(period.interestExpense)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatCOP(period.netProfit)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatNumber(period.employees)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Indicadores financieros</h2>
        {GROUPS.map((group) => (
          <div key={group} className="grid gap-3">
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{group}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {views.filter((item) => item.grupo === group).map((item) => (
                <IndicatorCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Clasificación de bienes y servicios</h2>
        <p className="text-sm text-muted-foreground">Códigos de demostración. Las descripciones no son el texto oficial UNSPSC.</p>
        {query.data.unspsc.length === 0 ? (
          <EmptyState title="Sin clasificación de bienes y servicios" />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  {["Código UNSPSC", "Descripción", "Clasificación", "Principal"].map((label) => (
                    <th key={label} className="px-3 py-2 font-medium">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data.unspsc.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium tabular-nums">{item.code}</td>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2">{item.clasificacion}</td>
                    <td className="px-3 py-2">{item.isPrimary ? <Badge>Principal</Badge> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        Periodo {latest.year} · Fecha de corte {formatDate(latest.cutoffDate)} · Fuente: {query.data.fuenteEtiqueta || FUENTE_DEMO}
      </p>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">{detail}</p>
      </CardContent>
    </Card>
  );
}

function IndicatorCard({ item }: { item: IndicatorView }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{item.nombre}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{item.valor}</p>
        <p className="text-sm leading-6 text-muted-foreground">{item.explicacion}</p>
        {item.variacion ? <p className="text-xs font-medium text-foreground">{item.variacion}</p> : null}
      </CardContent>
    </Card>
  );
}
