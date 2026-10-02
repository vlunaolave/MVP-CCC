"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/shared/lib/api-client";
import { useUiStore } from "@/shared/lib/ui-store";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { DashboardPayload, SeriesPoint } from "@/shared/types/domain";

const ALL = "todos";

const emptyFilters = { desde: "", hasta: "", tipoRegistro: ALL, municipio: ALL, estadoMatricula: ALL };

export function DashboardScreen() {
  const user = useUiStore((state) => state.user);
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const query = useQuery({
    queryKey: ["dashboard", filters],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardPayload>("/api/dashboard", {
        params: {
          desde: filters.desde || undefined,
          hasta: filters.hasta || undefined,
          tipoRegistro: filters.tipoRegistro === ALL ? undefined : filters.tipoRegistro,
          municipio: filters.municipio === ALL ? undefined : filters.municipio,
          estadoMatricula: filters.estadoMatricula === ALL ? undefined : filters.estadoMatricula,
        },
      });
      return data;
    },
  });
  const canAlerts = user?.permisos.includes("alertas.ver") ?? false;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Indicadores del padrón simulado. Los filtros cambian todas las series.</p>
      </div>
      <form
        className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters(draft);
        }}
      >
        <Field label="Desde">
          <Input type="date" value={draft.desde} onChange={(event) => setDraft({ ...draft, desde: event.target.value })} />
        </Field>
        <Field label="Hasta">
          <Input type="date" value={draft.hasta} onChange={(event) => setDraft({ ...draft, hasta: event.target.value })} />
        </Field>
        <Choice label="Tipo de empresa" value={draft.tipoRegistro} onChange={(tipoRegistro) => setDraft({ ...draft, tipoRegistro })}>
          <SelectItem value={ALL}>Todos</SelectItem>
          <SelectItem value="MERCANTIL">Registro Mercantil</SelectItem>
          <SelectItem value="ESAL">ESAL</SelectItem>
        </Choice>
        <Choice label="Municipio" value={draft.municipio} testId="dashboard-filter-municipio" onChange={(municipio) => setDraft({ ...draft, municipio })}>
          <SelectItem value={ALL}>Todos</SelectItem>
          {(query.data?.opciones.municipios ?? []).map((municipio) => (
            <SelectItem key={municipio} value={municipio}>
              {municipio}
            </SelectItem>
          ))}
        </Choice>
        <Choice label="Estado" value={draft.estadoMatricula} onChange={(estadoMatricula) => setDraft({ ...draft, estadoMatricula })}>
          <SelectItem value={ALL}>Todos</SelectItem>
          <SelectItem value="ACTIVA">Activa</SelectItem>
          <SelectItem value="SUSPENDIDA">Suspendida</SelectItem>
          <SelectItem value="CANCELADA">Cancelada</SelectItem>
          <SelectItem value="INACTIVA">Inactiva</SelectItem>
        </Choice>
        <div className="flex items-end gap-2 md:col-span-5">
          <Button type="submit">Aplicar filtros</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(emptyFilters);
              setFilters(emptyFilters);
            }}
          >
            Limpiar
          </Button>
        </div>
      </form>
      {query.isLoading ? <LoadingBlock rows={3} /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi label="Empresas consultadas" value={query.data.kpis.consultadas} />
            <Kpi label="Empresas monitoreadas" value={query.data.kpis.monitoreadas} />
            {canAlerts ? (
              <Link href="/alertas" className="rounded-xl border bg-card p-4 shadow-sm hover:border-primary/40">
                <p className="text-xs tracking-wide text-muted-foreground uppercase">Alertas generadas</p>
                <p className="mt-2 text-3xl font-semibold">{query.data.kpis.alertasGeneradas}</p>
              </Link>
            ) : (
              <Kpi label="Alertas generadas" value={query.data.kpis.alertasGeneradas} />
            )}
            <Kpi label="Registro Mercantil" value={query.data.kpis.mercantil} />
            <Kpi label="ESAL" value={query.data.kpis.esal} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Empresas por tipo" data={query.data.empresasPorTipo} />
            <ChartCard title="Empresas por estado" data={query.data.empresasPorEstado} />
            <ChartCard title="Empresas por actividad económica" data={query.data.empresasPorActividad} horizontal />
            <ChartCard title="Alertas por tipo" data={query.data.alertasPorTipo} />
            <ChartCard title="Alertas generadas en el tiempo" data={query.data.alertasEnElTiempo} line />
            <ChartCard title="Empresas monitoreadas por municipio" data={query.data.monitoreadasPorMunicipio} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  data,
  horizontal = false,
  line = false,
}: {
  title: string;
  data: SeriesPoint[];
  horizontal?: boolean;
  line?: boolean;
}) {
  const height = horizontal ? Math.max(280, data.length * 36) : 280;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState title="No hay datos para los filtros seleccionados." />
        ) : (
          <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              {line ? (
                <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" name="Alertas" stroke="var(--chart-1)" strokeWidth={2} dot />
                </LineChart>
              ) : (
                <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ left: horizontal ? 8 : 0, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  {horizontal ? (
                    <>
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 11 }} />
                    </>
                  ) : (
                    <>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} height={70} textAnchor="end" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
                    </>
                  )}
                  <Tooltip />
                  <Bar dataKey="value" name="Total" fill="var(--chart-1)" radius={4} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Choice({
  label,
  value,
  onChange,
  children,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full" data-testid={testId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}
