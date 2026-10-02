"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, apiErrorMessage } from "@/shared/lib/api-client";
import { DataSourceBadge } from "@/shared/components/data-source-badge";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { SectorDetalle } from "@/shared/types/domain";
import { formatPercent, formatTimes } from "@/server/services/financial-indicators";
import { formatMoney } from "@/shared/utils/labels";

export function SectorDetailScreen({ codigo }: { codigo: string }) {
  const query = useQuery({
    queryKey: ["sector", codigo],
    queryFn: async () => {
      const { data } = await apiClient.get<SectorDetalle>(`/api/sectores/${codigo}`);
      return data;
    },
  });

  if (query.isLoading) {
    return <LoadingBlock rows={4} />;
  }
  if (query.isError) {
    const missing = apiErrorMessage(query.error, "").includes("no existe");
    if (missing) {
      return <EmptyState title="El sector no existe." description="Vuelve al listado de sectores." />;
    }
    return <ErrorState onRetry={() => void query.refetch()} />;
  }
  if (!query.data) {
    return <EmptyState title="El sector no existe." />;
  }

  const sector = query.data;
  const indicators = [
    ["Margen neto", formatPercent(sector.indicadores.margenNeto)],
    ["Margen operativo", formatPercent(sector.indicadores.margenOperativo)],
    ["ROA", formatPercent(sector.indicadores.roa)],
    ["ROE", formatPercent(sector.indicadores.roe)],
    ["Deuda / patrimonio", formatTimes(sector.indicadores.deudaPatrimonio)],
    ["Crecimiento de ingresos", formatPercent(sector.indicadores.crecimientoIngresos, true)],
    ["Crecimiento de activos", formatPercent(sector.indicadores.crecimientoActivos, true)],
    ["Razón corriente", formatTimes(sector.indicadores.razonCorriente)],
  ] as const;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <DataSourceBadge />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{sector.nombre}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6">{sector.resumen}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/sectores">Todos los sectores</Link>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Empresas" value={String(sector.empresas)} />
        <Metric label="Ingresos agregados" value={formatMoney(sector.ingresosAgregados)} />
        <Metric label="Empleados" value={String(sector.empleados)} />
        <Metric label="Crecimiento promedio" value={formatPercent(sector.crecimientoPromedio, true)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Principales empresas por ingresos del último año</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {sector.principales.length === 0 ? <EmptyState title="Este sector no tiene empresas en el padrón." /> : null}
          {sector.principales.map((company) => (
            <Link key={company.id} href={`/empresas/${company.id}`} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 hover:bg-muted">
              <span>
                <span className="block text-sm font-medium">{company.razonSocial}</span>
                <span className="text-xs text-muted-foreground">{company.nit} · {company.municipio}</span>
              </span>
              <span className="text-sm">{formatMoney(company.ingresos)}</span>
            </Link>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <MiniChart title="Distribución por tamaño" data={sector.porTamano} />
        <MiniChart title="Distribución por municipio" data={sector.porMunicipio} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolución de ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          {sector.evolucionIngresos.length === 0 ? (
            <EmptyState title="No hay periodos financieros en este sector." />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sector.evolucionIngresos}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={72} />
                  <Tooltip />
                  <Bar dataKey="ingresos" name="Ingresos" fill="var(--chart-1)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Indicadores promedio {sector.anioBenchmark ?? ""}</CardTitle>
            <DataSourceBadge />
          </div>
          <p className="text-sm text-muted-foreground">Promedios de demostración del sector.</p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {indicators.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function MiniChart({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState title="No hay datos para esta distribución." />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
                <Tooltip />
                <Bar dataKey="value" name="Empresas" fill="var(--chart-1)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
