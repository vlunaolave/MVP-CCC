"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FilterBar, FilterField, type FilterChip } from "@/shared/components/filter-panel";
import { apiClient } from "@/shared/lib/api-client";
import { DataSourceBadge } from "@/shared/components/data-source-badge";
import { ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { SectorResumen } from "@/shared/types/domain";
import { formatPercent } from "@/server/services/financial-indicators";
import { formatCOPCompact } from "@/shared/utils/format";

const ACCENTS = ["bg-blue-600", "bg-cyan-600", "bg-violet-600", "bg-emerald-600", "bg-orange-500", "bg-fuchsia-600", "bg-sky-700"];

export function SectorsScreen() {
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["sectores"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: SectorResumen[] }>("/api/sectores");
      return data.items;
    },
  });

  return (
    <div className="grid gap-6">
      <div>
        <DataSourceBadge />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sectores</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Conteos del padrón de demostración y promedios publicados. No es un ranking.
        </p>
      </div>
      <FilterBar
        mode="popover"
        count={q ? 1 : 0}
        chips={q ? [{ id: "q", label: `Sector: ${q}` }] satisfies FilterChip[] : []}
        dirty={draft !== q}
        onApply={() => setQ(draft.trim())}
        onClear={() => {
          setDraft("");
          setQ("");
        }}
        onRemove={() => {
          setDraft("");
          setQ("");
        }}
      >
        <FilterField label="Nombre del sector" pending={draft !== q}>
          <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tecnología, salud, comercio…" />
        </FilterField>
      </FilterBar>
      {query.isLoading ? <LoadingBlock rows={3} /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {query.data.filter((sector) => sector.nombre.toLocaleLowerCase("es").includes(q.toLocaleLowerCase("es"))).length === 0 ? (
            <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-3">Ningún sector coincide con el filtro.</p>
          ) : null}
          {query.data
            .filter((sector) => sector.nombre.toLocaleLowerCase("es").includes(q.toLocaleLowerCase("es")))
            .map((sector, index) => (
            <Link key={sector.codigo} href={`/sectores/${sector.slug}`} className="rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2">
              <Card className="h-full overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`h-1 ${ACCENTS[index % ACCENTS.length]}`} />
                <CardHeader>
                  <CardTitle className="text-lg">{sector.nombre}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-1 text-sm">
                  <p>{sector.empresas} empresas</p>
                  <p>Ingresos agregados {formatCOPCompact(sector.ingresosAgregados)}</p>
                  <p>{sector.empleados} empleados</p>
                  <p>Crecimiento promedio {formatPercent(sector.crecimientoPromedio, true)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
