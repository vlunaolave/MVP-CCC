"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Bell, Building2, Eye, Layers, MapPinned, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InsightChart, KpiCard, monthMovement } from "@/shared/components/insight-cards";
import { apiClient, apiErrorMessage } from "@/shared/lib/api-client";
import { useUiStore } from "@/shared/lib/ui-store";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import { EnrollmentBadge, SeverityBadge } from "@/shared/components/status-badge";
import type { AlertItem, CompanySearchPayload, DashboardPayload, MonitoringItem, SavedSearchItem } from "@/shared/types/domain";
import { SECTOR_CODIGOS } from "@/shared/types/domain";
import type { CompanyFilters } from "@/shared/types/filters";
import { formatDisplayDate, greetingFor } from "@/shared/utils/dates";
import { SECTOR_LABEL, SECTOR_SLUG } from "@/shared/utils/labels";

export function HomeScreen() {
  const router = useRouter();
  const user = useUiStore((state) => state.user);
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const canMonitor = user?.permisos.includes("monitoreo.ver") ?? false;
  const canAlerts = user?.permisos.includes("alertas.ver") ?? false;
  const companies = useQuery({
    queryKey: ["companies", {}],
    queryFn: async () => {
      const { data } = await apiClient.get<CompanySearchPayload>("/api/empresas");
      return data;
    },
  });
  const dashboard = useQuery({
    queryKey: ["dashboard", "home"],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardPayload>("/api/dashboard");
      return data;
    },
  });
  const monitoring = useQuery({
    queryKey: ["monitoring", user?.id ?? "anon", {}],
    enabled: canMonitor,
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: MonitoringItem[] }>("/api/monitoreo");
      return data.items;
    },
  });
  const searches = useQuery({
    queryKey: ["busquedas", user?.id ?? "anon"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: SavedSearchItem[] }>("/api/busquedas");
      return data.items;
    },
  });
  const removeSearch = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/busquedas/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["busquedas", user?.id ?? "anon"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "No se pudo borrar la búsqueda.")),
  });
  const alerts = useQuery({
    queryKey: ["alerts", { recientes: true }],
    enabled: canAlerts,
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: AlertItem[]; noLeidas: number }>("/api/alertas");
      return data;
    },
  });

  if (!user) {
    return <LoadingBlock />;
  }

  const rankedSectors = SECTOR_CODIGOS.map((codigo) => ({
    codigo,
    empresas: dashboard.data?.empresasPorSector.find((sector) => sector.label === SECTOR_LABEL[codigo])?.value ?? 0,
  })).sort((left, right) => right.empresas - left.empresas);
  const recentMonitoring = [...(monitoring.data ?? [])].sort((left, right) => right.fechaInicio.localeCompare(left.fechaInicio));

  return (
    <div className="grid gap-8">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Cámara de Comercio de Cali</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Inteligencia Empresarial</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {greetingFor(user.nombre)}. Información estratégica para conocer, analizar y monitorear empresas.
        </p>
        <form
          className="relative mt-5 max-w-3xl"
          onSubmit={(event) => {
            event.preventDefault();
            const value = q.trim();
            router.push(value ? `/empresas?q=${encodeURIComponent(value)}` : "/empresas");
          }}
        >
          <label htmlFor="home-search" className="sr-only">
            Buscar empresa por nombre, NIT, actividad o sector
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="home-search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar empresa por nombre, NIT, actividad o sector"
            className="h-12 rounded-2xl bg-white pr-4 pl-11 text-base shadow-sm"
          />
        </form>
      </header>

      {dashboard.isLoading ? <LoadingBlock rows={2} /> : null}
      {dashboard.isError ? <ErrorState onRetry={() => void dashboard.refetch()} /> : null}
      {dashboard.data ? (
        <section aria-label="Indicadores ejecutivos" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Empresas disponibles"
            value={String(dashboard.data.kpis.disponibles)}
            hint={`${dashboard.data.kpis.mercantil} mercantiles · ${dashboard.data.kpis.esal} ESAL`}
            icon={Building2}
            tone="navy"
            href="/empresas"
          />
          <KpiCard
            label="Empresas monitoreadas"
            value={String(dashboard.data.kpis.monitoreadas)}
            hint={monthMovement(dashboard.data.contexto.monitoreo)}
            icon={Eye}
            tone="cyan"
            href={canMonitor ? "/monitoreo" : undefined}
            delay={60}
          />
          <KpiCard
            label="Alertas generadas"
            value={String(dashboard.data.kpis.alertasGeneradas)}
            hint={monthMovement(dashboard.data.contexto.alertas)}
            icon={Bell}
            tone="orange"
            href={canAlerts ? "/alertas" : undefined}
            delay={120}
          />
          <KpiCard
            label="Sectores analizados"
            value={String(dashboard.data.kpis.sectoresAnalizados)}
            hint="Con empresas en el padrón"
            icon={Layers}
            tone="violet"
            href="/sectores"
            delay={180}
          />
          <KpiCard
            label="Empresas consultadas"
            value={String(dashboard.data.kpis.consultadas)}
            hint={monthMovement(dashboard.data.contexto.consultas)}
            icon={Search}
            tone="blue"
            href="/empresas"
            delay={240}
          />
          <KpiCard
            label="Empresas con cambios recientes"
            value={String(dashboard.data.kpis.cambiosRecientes)}
            hint={canAlerts ? "Con alertas en el periodo" : "Cambios detectados en el padrón"}
            icon={Activity}
            tone="green"
            href={canAlerts ? "/alertas" : undefined}
            delay={300}
          />
        </section>
      ) : null}

      {dashboard.data ? (
        <section className="grid gap-4 lg:grid-cols-2" aria-label="Distribución del padrón">
          <InsightChart title="Empresas por sector" data={dashboard.data.empresasPorSector} kind="horizontal" accent="bg-[var(--chart-1)]" />
          <InsightChart title="Empresas por tamaño" data={dashboard.data.empresasPorTamano} accent="bg-[var(--chart-3)]" />
          <InsightChart title="Empresas por municipio" data={dashboard.data.empresasPorMunicipio} kind="horizontal" accent="bg-[var(--chart-2)]" limit={8} />
          <InsightChart title="Empresas Mercantiles vs ESAL" data={dashboard.data.empresasPorTipo} kind="donut" accent="bg-[var(--chart-5)]" />
          {canAlerts ? (
            <>
              <InsightChart title="Alertas por categoría" data={dashboard.data.alertasPorCategoria} accent="bg-[var(--chart-4)]" />
              <InsightChart title="Evolución de alertas" data={dashboard.data.alertasEnElTiempo} kind="line" accent="bg-[var(--chart-2)]" />
            </>
          ) : null}
        </section>
      ) : null}

      {canAlerts && dashboard.data ? (
        <section className="grid gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Empresas que requieren atención</h2>
              <p className="text-sm text-muted-foreground">Organizaciones con alertas recientes en el padrón.</p>
            </div>
            <Button asChild variant="link" className="h-auto px-0">
              <Link href="/alertas">Ver alertas</Link>
            </Button>
          </div>
          {dashboard.data.atencion.length === 0 ? <EmptyState title="No hay empresas con alertas en este corte." /> : null}
          <ul className="grid gap-3 md:grid-cols-2">
            {dashboard.data.atencion.map((company) => (
              <li key={company.companyId}>
                <Link href={`/empresas/${company.companyId}`} className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2">
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

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Sectores con mayor número de empresas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {rankedSectors.map((sector, index) => (
              <Link key={sector.codigo} href={`/sectores/${SECTOR_SLUG[sector.codigo]}`} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2">
                <span className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-md bg-violet-50 text-xs font-semibold text-violet-700">{index + 1}</span>
                  {SECTOR_LABEL[sector.codigo]}
                </span>
                <span className="font-medium">{sector.empresas}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Actividad reciente</CardTitle>
            {canAlerts ? (
              <Button asChild variant="link" className="h-auto px-0">
                <Link href="/alertas">Alertas</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-3">
            {canAlerts
              ? alerts.data?.items.slice(0, 4).map((alert) => (
                  <Link key={alert.id} href={`/empresas/${alert.companyId}`} className="rounded-xl border px-3 py-2 transition hover:bg-muted">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{alert.razonSocial}</p>
                      <SeverityBadge severidad={alert.severidad} />
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.titulo} · {formatDisplayDate(alert.fecha)}</p>
                  </Link>
                ))
              : null}
            {companies.data?.recientes.slice(0, canAlerts ? 2 : 4).map((company) => (
              <Link key={company.id} href={`/empresas/${company.id}`} className="rounded-xl border px-3 py-2 transition hover:bg-muted">
                <p className="text-sm font-medium">{company.razonSocial}</p>
                <p className="text-xs text-muted-foreground">Consulta reciente · {company.nit} · {company.municipio}</p>
              </Link>
            ))}
            {!canAlerts && companies.data && companies.data.recientes.length === 0 ? (
              <EmptyState title="Todavía no hay consultas recientes." description="Abre un perfil y volverá a aparecer aquí." />
            ) : null}
            {canAlerts && alerts.data && alerts.data.items.length === 0 && companies.data && companies.data.recientes.length === 0 ? (
              <EmptyState title="Todavía no hay actividad reciente." />
            ) : null}
          </CardContent>
        </Card>
        {canMonitor ? (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Empresas monitoreadas recientemente</CardTitle>
              <Button asChild variant="link" className="h-auto px-0">
                <Link href="/monitoreo">Abrir</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
              {recentMonitoring.length === 0 ? <EmptyState title="Todavía no monitoreas empresas." /> : null}
              {recentMonitoring.slice(0, 4).map((item) => (
                <Link key={item.companyId} href={`/empresas/${item.companyId}`} className="rounded-xl border px-3 py-2 transition hover:bg-muted">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.razonSocial}</p>
                    <EnrollmentBadge estado={item.estadoMatricula} />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.alertas} alertas · desde {formatDisplayDate(item.fechaInicio)}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Alcance del rol</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-3 text-sm leading-6">
              <Sparkles className="mt-0.5 size-4 text-primary" aria-hidden="true" />
              <p>Tu rol consulta empresas, sectores y el tablero. No incluye monitoreo ni el detalle de alertas.</p>
            </CardContent>
          </Card>
        )}
      </section>

      {companies.isError || monitoring.isError || alerts.isError ? (
        <ErrorState
          onRetry={() => {
            void companies.refetch();
            void monitoring.refetch();
            void alerts.refetch();
          }}
        />
      ) : null}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="size-4 text-primary" aria-hidden="true" />
            Búsquedas guardadas
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {searches.data && searches.data.length === 0 ? <EmptyState title="Todavía no guardas búsquedas." /> : null}
          {searches.data?.map((search) => (
            <div key={search.id} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
              <Link href={searchHref(search.filtros)} className="text-sm font-medium hover:underline">{search.nombre}</Link>
              <Button type="button" variant="outline" size="sm" onClick={() => removeSearch.mutate(search.id)}>Quitar</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function searchHref(filtros: CompanyFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filtros)) {
    if (value !== undefined && value !== null && String(value) !== "") {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `/empresas?${query}` : "/empresas";
}
