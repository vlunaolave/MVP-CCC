"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, XAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterBar, FilterGroup } from "@/shared/components/filter-panel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useComparisonStore } from "@/features/comparison/store";
import { apiClient } from "@/shared/lib/api-client";
import { CurrencyTooltip, CurrencyYAxis } from "@/shared/components/currency-axis";
import { DataSourceBadge } from "@/shared/components/data-source-badge";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { ComparadorColumna, ComparadorPayload } from "@/shared/types/domain";
import { formatPercent } from "@/server/services/financial-indicators";
import { SECTOR_LABEL, formatMoney } from "@/shared/utils/labels";

const GROUPS = [
  { id: "identidad", label: "Identificación" },
  { id: "finanzas", label: "Finanzas" },
  { id: "indicadores", label: "Indicadores" },
] as const;

type MetricGroup = (typeof GROUPS)[number]["id"];

const ROWS: { key: keyof ComparadorColumna; label: string; kind: "text" | "money" | "percent" | "number"; group: MetricGroup }[] = [
  { key: "sector", label: "Sector", kind: "text", group: "identidad" },
  { key: "ciudad", label: "Ciudad", kind: "text", group: "identidad" },
  { key: "antiguedad", label: "Antigüedad", kind: "text", group: "identidad" },
  { key: "empleados", label: "Empleados", kind: "number", group: "finanzas" },
  { key: "ingresos", label: "Ingresos", kind: "money", group: "finanzas" },
  { key: "ebitda", label: "EBITDA", kind: "money", group: "finanzas" },
  { key: "utilidad", label: "Utilidad", kind: "money", group: "finanzas" },
  { key: "activos", label: "Activos", kind: "money", group: "finanzas" },
  { key: "patrimonio", label: "Patrimonio", kind: "money", group: "finanzas" },
  { key: "margenNeto", label: "Margen neto", kind: "percent", group: "indicadores" },
  { key: "roe", label: "ROE", kind: "percent", group: "indicadores" },
  { key: "crecimientoIngresos", label: "Crecimiento de ingresos", kind: "percent", group: "indicadores" },
];

function cell(column: ComparadorColumna, key: keyof ComparadorColumna, kind: "text" | "money" | "percent" | "number") {
  const value = column[key];
  if (key === "sector" && typeof value === "string") {
    return SECTOR_LABEL[value as ComparadorColumna["sector"]];
  }
  if (kind === "money") {
    return formatMoney(typeof value === "number" ? value : null);
  }
  if (kind === "percent") {
    return formatPercent(typeof value === "number" ? value : null, key === "crecimientoIngresos");
  }
  if (kind === "number") {
    return typeof value === "number" ? String(value) : "Sin información";
  }
  return value ? String(value) : "Sin información";
}

export function ComparadorScreen() {
  const ids = useComparisonStore((state) => state.ids);
  const remove = useComparisonStore((state) => state.remove);
  const clear = useComparisonStore((state) => state.clear);
  const router = useRouter();
  const [draftGroups, setDraftGroups] = useState<MetricGroup[]>([]);
  const [groups, setGroups] = useState<MetricGroup[]>([]);
  const joined = ids.join(",");
  const visibleRows = groups.length === 0 ? ROWS : ROWS.filter((row) => groups.includes(row.group));

  useEffect(() => {
    const next = joined ? `/comparador?ids=${encodeURIComponent(joined)}` : "/comparador";
    router.replace(next);
  }, [joined, router]);

  const query = useQuery({
    queryKey: ["comparador", ids],
    queryFn: async () => {
      const { data } = await apiClient.get<ComparadorPayload>("/api/comparador", {
        params: { ids: joined || undefined },
      });
      return data;
    },
  });

  const chart = (query.data?.columnas ?? [])
    .filter((column) => column.anio !== null)
    .map((column) => ({
      nombre: column.razonSocial,
      ingresos: column.ingresos ?? 0,
      utilidad: column.utilidad ?? 0,
      activos: column.activos ?? 0,
    }));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <DataSourceBadge />
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Comparador</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hasta cuatro empresas, con el último periodo disponible de cada una.</p>
        </div>
        {ids.length > 0 ? (
          <Button type="button" variant="outline" onClick={() => clear()}>
            Vaciar comparador
          </Button>
        ) : null}
      </div>
      <FilterBar
        mode="popover"
        count={groups.length}
        chips={groups.map((id) => ({ id, label: `Grupo: ${GROUPS.find((group) => group.id === id)?.label ?? id}` }))}
        dirty={draftGroups.join() !== groups.join()}
        onApply={() => setGroups(draftGroups)}
        onClear={() => {
          setDraftGroups([]);
          setGroups([]);
        }}
        onRemove={(id) => {
          setGroups((current) => current.filter((group) => group !== id));
          setDraftGroups((current) => current.filter((group) => group !== id));
        }}
      >
        <FilterGroup title="Métricas visibles">
          <p className="text-xs text-muted-foreground">Sin selección se muestran todos los grupos.</p>
          {GROUPS.map((group) => {
            const checked = draftGroups.includes(group.id);
            return (
              <label key={group.id} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    setDraftGroups((current) => (checked ? current.filter((id) => id !== group.id) : [...current, group.id]));
                  }}
                />
                {group.label}
              </label>
            );
          })}
        </FilterGroup>
      </FilterBar>
      {ids.length === 0 ? (
        <EmptyState title="El comparador está vacío." description="Agrega empresas desde un perfil con el botón Comparar." />
      ) : null}
      {query.isLoading && ids.length > 0 ? <LoadingBlock /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.ausentes.length > 0 ? (
        <p className="text-sm text-muted-foreground">No se encontraron: {query.data.ausentes.join(", ")}.</p>
      ) : null}
      {query.data && query.data.columnas.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dato</TableHead>
                {query.data.columnas.map((column) => (
                  <TableHead key={column.id}>
                    <Link href={`/empresas/${column.id}`} className="font-medium hover:underline">
                      {column.razonSocial}
                    </Link>
                    <Button type="button" variant="link" className="h-auto px-0" onClick={() => remove(column.id)}>
                      Quitar
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  {query.data?.columnas.map((column) => (
                    <TableCell key={column.id}>{cell(column, row.key, row.kind)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingresos, utilidad y activos</CardTitle>
        </CardHeader>
        <CardContent>
          {(query.data?.columnas.length ?? 0) < 2 ? (
            <EmptyState title="Agrega al menos dos empresas para ver el gráfico" />
          ) : (
            <div className="h-80 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ left: 4, right: 8, top: 8, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={56} />
                  <CurrencyYAxis />
                  <CurrencyTooltip />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos" fill="var(--chart-1)" radius={4} />
                  <Bar dataKey="utilidad" name="Utilidad" fill="var(--chart-2)" radius={4} />
                  <Bar dataKey="activos" name="Activos" fill="var(--chart-3)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
