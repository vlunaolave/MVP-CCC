"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/shared/lib/api-client";
import { DataSourceBadge } from "@/shared/components/data-source-badge";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { FinancePayload, IndicatorSet } from "@/shared/types/domain";
import { formatPercent, formatTimes } from "@/server/services/financial-indicators";
import { formatMoney } from "@/shared/utils/labels";

function indicatorCells(indicators: IndicatorSet) {
  return [
    formatPercent(indicators.margenNeto),
    formatPercent(indicators.margenOperativo),
    formatPercent(indicators.roa),
    formatPercent(indicators.roe),
    formatTimes(indicators.razonCorriente),
    formatTimes(indicators.deudaPatrimonio),
    formatPercent(indicators.crecimientoIngresos, true),
    formatPercent(indicators.crecimientoActivos, true),
  ];
}

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
  const chart = query.data.periodos.map((period) => ({
    year: String(period.year),
    ingresos: period.revenue,
    utilidad: period.netProfit,
    activos: period.totalAssets,
    pasivos: period.totalLiabilities,
  }));
  if (!latest) {
    return <EmptyState title="Sin información financiera disponible" />;
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DataSourceBadge />
        <p className="text-sm text-muted-foreground">Año de corte {latest.year}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Ingresos" value={formatMoney(latest.revenue)} />
        <Metric label="EBITDA" value={formatMoney(latest.ebitda)} />
        <Metric label="Utilidad" value={formatMoney(latest.netProfit)} />
        <Metric label="Activos" value={formatMoney(latest.totalAssets)} />
        <Metric label="Patrimonio" value={formatMoney(latest.equity)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Evolución de ingresos">
          <LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={72} />
            <Tooltip />
            <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="var(--chart-1)" strokeWidth={2} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Evolución de utilidad">
          <LineChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={72} />
            <Tooltip />
            <Line type="monotone" dataKey="utilidad" name="Utilidad" stroke="var(--chart-2)" strokeWidth={2} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Activos y pasivos">
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={72} />
            <Tooltip />
            <Legend />
            <Bar dataKey="activos" name="Activos" fill="var(--chart-1)" radius={4} />
            <Bar dataKey="pasivos" name="Pasivos" fill="var(--chart-3)" radius={4} />
          </BarChart>
        </ChartCard>
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              {["Año", "Ingresos", "EBITDA", "Utilidad", "Activos", "Pasivos", "Patrimonio", "Empleados", "Activo corriente", "Pasivo corriente", "Margen neto", "Margen operativo", "ROA", "ROE", "Razón corriente", "Deuda / patrimonio", "Crec. ingresos", "Crec. activos"].map((label) => (
                <th key={label} className="px-3 py-2 font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {query.data.periodos.map((period) => (
              <tr key={period.year} className="border-b last:border-0">
                <td className="px-3 py-2">{period.year}</td>
                <td className="px-3 py-2">{formatMoney(period.revenue)}</td>
                <td className="px-3 py-2">{formatMoney(period.ebitda)}</td>
                <td className="px-3 py-2">{formatMoney(period.netProfit)}</td>
                <td className="px-3 py-2">{formatMoney(period.totalAssets)}</td>
                <td className="px-3 py-2">{formatMoney(period.totalLiabilities)}</td>
                <td className="px-3 py-2">{formatMoney(period.equity)}</td>
                <td className="px-3 py-2">{period.employees}</td>
                <td className="px-3 py-2">{formatMoney(period.currentAssets)}</td>
                <td className="px-3 py-2">{formatMoney(period.currentLiabilities)}</td>
                {indicatorCells(period.indicadores).map((value, index) => (
                  <td key={`${period.year}-${index}`} className="px-3 py-2">{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium">{value}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
