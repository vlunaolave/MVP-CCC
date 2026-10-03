"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterBar, FilterField, type FilterChip } from "@/shared/components/filter-panel";
import { MonitorButton } from "@/features/companies";
import { apiClient } from "@/shared/lib/api-client";
import { useUiStore } from "@/shared/lib/ui-store";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import { EnrollmentBadge } from "@/shared/components/status-badge";
import type { EstadoMatricula, MonitoringItem } from "@/shared/types/domain";
import { formatDisplayDate } from "@/shared/utils/dates";
import { ESTADO_MATRICULA_LABEL } from "@/shared/utils/labels";

const ALL = "todos";

export function MonitoringScreen() {
  const user = useUiStore((state) => state.user);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState(ALL);
  const [applied, setApplied] = useState({ q: "", estadoMatricula: "" });
  const query = useQuery({
    queryKey: ["monitoring", user?.id ?? "anon", applied],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: MonitoringItem[] }>("/api/monitoreo", {
        params: {
          q: applied.q || undefined,
          estadoMatricula: applied.estadoMatricula || undefined,
        },
      });
      return data.items;
    },
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Monitoreo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Empresas que sigues. El listado es tuyo: no se comparte con otros usuarios.</p>
      </div>
      <FilterBar
        mode="popover"
        count={monitoringChips(applied).length}
        chips={monitoringChips(applied)}
        dirty={q !== applied.q || (estado === ALL ? "" : estado) !== applied.estadoMatricula}
        onApply={() => setApplied({ q, estadoMatricula: estado === ALL ? "" : estado })}
        onClear={() => {
          setQ("");
          setEstado(ALL);
          setApplied({ q: "", estadoMatricula: "" });
        }}
        onRemove={(id) => {
          if (id === "q") {
            setQ("");
            setApplied({ ...applied, q: "" });
          }
          if (id === "estado") {
            setEstado(ALL);
            setApplied({ ...applied, estadoMatricula: "" });
          }
        }}
      >
        <FilterField label="Empresa o NIT" pending={q !== applied.q}>
          <Input id="monitoring-q" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Nombre o NIT" />
        </FilterField>
        <FilterField label="Estado empresarial" pending={(estado === ALL ? "" : estado) !== applied.estadoMatricula}>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[80]">
              <SelectItem value={ALL}>Todos</SelectItem>
              <SelectItem value="ACTIVA">Activa</SelectItem>
              <SelectItem value="SUSPENDIDA">Suspendida</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
              <SelectItem value="INACTIVA">Inactiva</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
      </FilterBar>
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.length === 0 ? (
        <EmptyState title="Todavía no monitoreas empresas." description="Desde el buscador puedes agregar una empresa a tu seguimiento." />
      ) : null}
      {query.data && query.data.length > 0 ? (
        <ul className="grid gap-3">
          {query.data.map((item) => (
            <li key={item.companyId} className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-medium">{item.razonSocial}</p>
                <p className="text-sm text-muted-foreground">NIT {item.nit}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <span>Inicio {formatDisplayDate(item.fechaInicio)}</span>
                  <span>Actualización {formatDisplayDate(item.fechaUltimaActualizacion)}</span>
                  <span>{item.alertas} alertas</span>
                  <EnrollmentBadge estado={item.estadoMatricula as EstadoMatricula} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/empresas/${item.companyId}`}>Abrir empresa</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/alertas?companyId=${item.companyId}`}>Ver alertas</Link>
                </Button>
                <MonitorButton companyId={item.companyId} monitoreada />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function monitoringChips(applied: { q: string; estadoMatricula: string }): FilterChip[] {
  const chips: FilterChip[] = [];
  if (applied.q) chips.push({ id: "q", label: `Empresa: ${applied.q}` });
  if (applied.estadoMatricula) {
    const label = ESTADO_MATRICULA_LABEL[applied.estadoMatricula as EstadoMatricula] ?? applied.estadoMatricula;
    chips.push({ id: "estado", label: `Estado: ${label}` });
  }
  return chips;
}
