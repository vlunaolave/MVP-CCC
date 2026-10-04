"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Bell, Building2, Eye, Layers, Search, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterBar, FilterField, FilterGroup, type FilterChip } from "@/shared/components/filter-panel";
import { InsightChart, KpiCard, monthMovement } from "@/shared/components/insight-cards";
import { apiClient } from "@/shared/lib/api-client";
import { useUiStore } from "@/shared/lib/ui-store";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { DashboardPayload, TamanoEmpresa } from "@/shared/types/domain";
import { SECTOR_CODIGOS } from "@/shared/types/domain";
import { formatPercent } from "@/server/services/financial-indicators";
import { formatCOPCompact } from "@/shared/utils/format";
import { ESTADO_MATRICULA_LABEL, SECTOR_LABEL, TAMANO_LABEL } from "@/shared/utils/labels";
import { formatDisplayDate } from "@/shared/utils/dates";

const ALL = "todos";

const emptyFilters = {
  desde: "",
  hasta: "",
  tipoRegistro: ALL,
  municipio: ALL,
  departamento: ALL,
  estadoMatricula: ALL,
  sector: ALL,
  tamanoEmpresa: ALL,
};

type DashboardDraft = typeof emptyFilters;

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
          departamento: filters.departamento === ALL ? undefined : filters.departamento,
          estadoMatricula: filters.estadoMatricula === ALL ? undefined : filters.estadoMatricula,
          sector: filters.sector === ALL ? undefined : filters.sector,
          tamanoEmpresa: filters.tamanoEmpresa === ALL ? undefined : filters.tamanoEmpresa,
        },
      });
      return data;
    },
  });
  const canAlerts = user?.permisos.includes("alertas.ver") ?? false;
  const chips = dashboardChips(filters);
  const dirty = JSON.stringify(draft) !== JSON.stringify(filters);

  function removeChip(id: string) {
    const next = { ...filters, [id]: id === "desde" || id === "hasta" ? "" : ALL };
    setDraft((current) => ({ ...current, [id]: next[id as keyof DashboardDraft] }));
    setFilters(next);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Analítica</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Indicadores del padrón. Los filtros se aplican a todas las series.</p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
      <FilterBar
        count={chips.length}
        chips={chips}
        dirty={dirty}
        onApply={() => setFilters(draft)}
        onClear={() => {
          setDraft(emptyFilters);
          setFilters(emptyFilters);
        }}
        onRemove={removeChip}
      >
        <FilterGroup title="Periodo">
          <FilterField label="Desde" pending={draft.desde !== filters.desde}>
            <Input type="date" value={draft.desde} onChange={(event) => setDraft({ ...draft, desde: event.target.value })} />
          </FilterField>
          <FilterField label="Hasta" pending={draft.hasta !== filters.hasta}>
            <Input type="date" value={draft.hasta} onChange={(event) => setDraft({ ...draft, hasta: event.target.value })} />
          </FilterField>
        </FilterGroup>
        <FilterGroup title="Ubicación">
          <Choice label="Departamento" value={draft.departamento} pending={draft.departamento !== filters.departamento} onChange={(departamento) => setDraft({ ...draft, departamento })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            {(query.data?.opciones.departamentos ?? []).map((departamento) => (
              <SelectItem key={departamento} value={departamento}>{departamento}</SelectItem>
            ))}
          </Choice>
          <Choice label="Municipio" value={draft.municipio} pending={draft.municipio !== filters.municipio} testId="dashboard-filter-municipio" onChange={(municipio) => setDraft({ ...draft, municipio })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            {(query.data?.opciones.municipios ?? []).map((municipio) => (
              <SelectItem key={municipio} value={municipio}>{municipio}</SelectItem>
            ))}
          </Choice>
        </FilterGroup>
        <FilterGroup title="Clasificación">
          <Choice label="Sector" value={draft.sector} pending={draft.sector !== filters.sector} onChange={(sector) => setDraft({ ...draft, sector })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            {SECTOR_CODIGOS.map((sector) => (
              <SelectItem key={sector} value={sector}>{SECTOR_LABEL[sector]}</SelectItem>
            ))}
          </Choice>
          <Choice label="Tamaño" value={draft.tamanoEmpresa} pending={draft.tamanoEmpresa !== filters.tamanoEmpresa} onChange={(tamanoEmpresa) => setDraft({ ...draft, tamanoEmpresa })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            {(Object.keys(TAMANO_LABEL) as TamanoEmpresa[]).map((tamano) => (
              <SelectItem key={tamano} value={tamano}>{TAMANO_LABEL[tamano]}</SelectItem>
            ))}
          </Choice>
        </FilterGroup>
        <FilterGroup title="Estado">
          <Choice label="Tipo de registro" value={draft.tipoRegistro} pending={draft.tipoRegistro !== filters.tipoRegistro} onChange={(tipoRegistro) => setDraft({ ...draft, tipoRegistro })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            <SelectItem value="MERCANTIL">Registro Mercantil</SelectItem>
            <SelectItem value="ESAL">ESAL</SelectItem>
          </Choice>
          <Choice label="Estado empresarial" value={draft.estadoMatricula} pending={draft.estadoMatricula !== filters.estadoMatricula} onChange={(estadoMatricula) => setDraft({ ...draft, estadoMatricula })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            <SelectItem value="ACTIVA">Activa</SelectItem>
            <SelectItem value="SUSPENDIDA">Suspendida</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
            <SelectItem value="INACTIVA">Inactiva</SelectItem>
          </Choice>
        </FilterGroup>
      </FilterBar>
      {query.isLoading ? <LoadingBlock rows={3} /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Indicadores">
            <KpiCard label="Empresas disponibles" value={String(query.data.kpis.disponibles)} hint={`${query.data.kpis.mercantil} mercantiles · ${query.data.kpis.esal} ESAL`} icon={Building2} tone="navy" />
            <KpiCard label="Empresas consultadas" value={String(query.data.kpis.consultadas)} hint={monthMovement(query.data.contexto.consultas)} icon={Search} tone="blue" delay={50} />
            <KpiCard label="Empresas monitoreadas" value={String(query.data.kpis.monitoreadas)} hint={monthMovement(query.data.contexto.monitoreo)} icon={Eye} tone="cyan" delay={100} />
            <KpiCard label="Alertas generadas" value={String(query.data.kpis.alertasGeneradas)} hint={monthMovement(query.data.contexto.alertas)} icon={Bell} tone="orange" href={canAlerts ? "/alertas" : undefined} delay={150} />
            <KpiCard label="Sectores analizados" value={String(query.data.kpis.sectoresAnalizados)} hint="Con empresas en el corte" icon={Layers} tone="violet" delay={200} />
            <KpiCard label="Empresas con cambios recientes" value={String(query.data.kpis.cambiosRecientes)} hint="Con al menos una alerta" icon={Activity} tone="green" delay={250} />
            <KpiCard label="Ingresos agregados" value={formatCOPCompact(query.data.kpis.ingresosAgregados)} icon={Wallet} tone="blue" delay={300} />
            <KpiCard label="Crecimiento promedio" value={formatPercent(query.data.kpis.crecimientoPromedio, true)} icon={TrendingUp} tone="green" delay={350} />
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <InsightChart title="Empresas por sector" data={query.data.empresasPorSector} kind="horizontal" />
            <InsightChart title="Empresas por tamaño" data={query.data.empresasPorTamano} accent="bg-[var(--chart-3)]" />
            <InsightChart title="Empresas por municipio" data={query.data.empresasPorMunicipio} kind="horizontal" accent="bg-[var(--chart-2)]" />
            <InsightChart title="Empresas por departamento" data={query.data.empresasPorDepartamento} accent="bg-[var(--chart-5)]" />
            <InsightChart title="Empresas Mercantiles vs ESAL" data={query.data.empresasPorTipo} kind="donut" accent="bg-[var(--chart-1)]" />
            <InsightChart title="Empresas por estado" data={query.data.empresasPorEstado} accent="bg-[var(--chart-4)]" />
            <InsightChart title="Empresas por actividad económica" data={query.data.empresasPorActividad} kind="horizontal" accent="bg-[var(--chart-6)]" limit={8} />
            <InsightChart title="Alertas por categoría" data={query.data.alertasPorCategoria} accent="bg-[var(--chart-4)]" />
            <InsightChart title="Alertas por tipo" data={query.data.alertasPorTipo} kind="horizontal" accent="bg-[var(--chart-6)]" />
            <InsightChart title="Evolución de alertas" data={query.data.alertasEnElTiempo} kind="line" accent="bg-[var(--chart-2)]" />
            <InsightChart title="Empresas monitoreadas por municipio" data={query.data.monitoreadasPorMunicipio} accent="bg-[var(--chart-2)]" />
          </section>
          {canAlerts ? (
            <section className="grid gap-3">
              <h2 className="text-lg font-semibold tracking-tight">Empresas que requieren atención</h2>
              {query.data.atencion.length === 0 ? <EmptyState title="No hay empresas con alertas para este corte." /> : null}
              <ul className="grid gap-3 md:grid-cols-2">
                {query.data.atencion.map((company) => (
                  <li key={company.companyId}>
                    <Link href={`/empresas/${company.companyId}`} className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:shadow-md">
                      <p className="font-semibold">{company.razonSocial}</p>
                      <p className="mt-1 text-sm font-medium text-orange-700">
                        {company.alertas === 1 ? "1 alerta reciente" : `${company.alertas} alertas recientes`}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">Último cambio: {company.ultimoCambio}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Empresas monitoreadas recientemente</h2>
            {query.data.monitoreoReciente.length === 0 ? <EmptyState title="No hay empresas monitoreadas en este corte." /> : null}
            <ul className="grid gap-3 md:grid-cols-2">
              {query.data.monitoreoReciente.map((company) => (
                <li key={company.companyId}>
                  <Link href={`/empresas/${company.companyId}`} className="block rounded-2xl border bg-white px-4 py-3 shadow-sm transition hover:bg-muted">
                    <p className="font-medium">{company.razonSocial}</p>
                    <p className="text-sm text-muted-foreground">{company.municipio} · desde {formatDisplayDate(company.fechaInicio)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}

function dashboardChips(filters: DashboardDraft): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.desde) chips.push({ id: "desde", label: `Desde: ${filters.desde}` });
  if (filters.hasta) chips.push({ id: "hasta", label: `Hasta: ${filters.hasta}` });
  if (filters.departamento !== ALL) chips.push({ id: "departamento", label: `Departamento: ${filters.departamento}` });
  if (filters.municipio !== ALL) chips.push({ id: "municipio", label: `Ciudad: ${filters.municipio}` });
  if (filters.sector !== ALL) chips.push({ id: "sector", label: `Sector: ${SECTOR_LABEL[filters.sector as keyof typeof SECTOR_LABEL] ?? filters.sector}` });
  if (filters.tamanoEmpresa !== ALL) chips.push({ id: "tamanoEmpresa", label: `Tamaño: ${TAMANO_LABEL[filters.tamanoEmpresa as TamanoEmpresa] ?? filters.tamanoEmpresa}` });
  if (filters.tipoRegistro !== ALL) chips.push({ id: "tipoRegistro", label: `Tipo: ${filters.tipoRegistro === "ESAL" ? "ESAL" : "Registro Mercantil"}` });
  if (filters.estadoMatricula !== ALL) {
    chips.push({ id: "estadoMatricula", label: `Estado: ${ESTADO_MATRICULA_LABEL[filters.estadoMatricula as keyof typeof ESTADO_MATRICULA_LABEL] ?? filters.estadoMatricula}` });
  }
  return chips;
}

function Choice({
  label,
  value,
  onChange,
  children,
  testId,
  pending = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  testId?: string;
  pending?: boolean;
}) {
  return (
    <FilterField label={label} pending={pending}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-white" data-testid={testId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[80]">{children}</SelectContent>
      </Select>
    </FilterField>
  );
}
