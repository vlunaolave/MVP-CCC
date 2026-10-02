"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/shared/lib/api-client";
import { useUiStore } from "@/shared/lib/ui-store";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import { EnrollmentBadge, SeverityBadge } from "@/shared/components/status-badge";
import type { AlertItem, CompanySearchPayload, MonitoringItem } from "@/shared/types/domain";
import { formatDisplayDate, greetingFor } from "@/shared/utils/dates";

export function HomeScreen() {
  const user = useUiStore((state) => state.user);
  const canMonitor = user?.permisos.includes("monitoreo.ver") ?? false;
  const canAlerts = user?.permisos.includes("alertas.ver") ?? false;
  const companies = useQuery({
    queryKey: ["companies", {}],
    queryFn: async () => {
      const { data } = await apiClient.get<CompanySearchPayload>("/api/empresas");
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
  const loading = companies.isLoading || (canMonitor && monitoring.isLoading) || (canAlerts && alerts.isLoading);
  const error = companies.isError || monitoring.isError || alerts.isError;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{greetingFor(user.nombre)}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {user.plataformaNombre}. El padrón de demostración reúne matrícula mercantil y ESAL de la Cámara de Comercio de Cali.
        </p>
      </div>
      {loading ? <LoadingBlock rows={2} /> : null}
      {error ? (
        <ErrorState
          onRetry={() => {
            void companies.refetch();
            void monitoring.refetch();
            void alerts.refetch();
          }}
        />
      ) : null}
      {companies.data ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi label="Empresas disponibles" value={companies.data.disponibles} href="/empresas" />
          {canMonitor ? <Kpi label="Empresas monitoreadas" value={monitoring.data?.length ?? 0} href="/monitoreo" /> : null}
          {canAlerts ? (
            <Kpi label="Alertas no leídas" value={alerts.data?.noLeidas ?? 0} href="/alertas" />
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Consultadas recientemente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {companies.data && companies.data.recientes.length === 0 ? (
              <EmptyState title="Todavía no hay consultas recientes." description="Abre un perfil y volverá a aparecer aquí." />
            ) : null}
            {companies.data?.recientes.map((company) => (
              <Link key={company.id} href={`/empresas/${company.id}`} className="rounded-lg border px-3 py-2 hover:bg-muted">
                <p className="text-sm font-medium">{company.razonSocial}</p>
                <p className="text-xs text-muted-foreground">{company.nit} · {company.municipio}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        {canAlerts ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Alertas recientes</CardTitle>
              <Button asChild variant="link" className="h-auto px-0">
                <Link href="/alertas">Ver todas</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
              {alerts.data && alerts.data.items.length === 0 ? <EmptyState title="No hay alertas registradas." /> : null}
              {alerts.data?.items.slice(0, 4).map((alert) => (
                <Link key={alert.id} href={`/empresas/${alert.companyId}`} className="rounded-lg border px-3 py-2 hover:bg-muted">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{alert.razonSocial}</p>
                    <SeverityBadge severidad={alert.severidad} />
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.titulo} · {formatDisplayDate(alert.fecha)}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Alcance del rol</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6">Tu rol no incluye monitoreo ni alertas.</p>
            </CardContent>
          </Card>
        )}
        {canMonitor ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bajo monitoreo</CardTitle>
              <Button asChild variant="link" className="h-auto px-0">
                <Link href="/monitoreo">Abrir seguimiento</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
              {monitoring.data && monitoring.data.length === 0 ? <EmptyState title="Todavía no monitoreas empresas." /> : null}
              {monitoring.data?.slice(0, 4).map((item) => (
                <Link key={item.companyId} href={`/empresas/${item.companyId}`} className="rounded-lg border px-3 py-2 hover:bg-muted">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.razonSocial}</p>
                    <EnrollmentBadge estado={item.estadoMatricula} />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.alertas} alertas · desde {formatDisplayDate(item.fechaInicio)}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Kpi({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-xl border bg-card p-4 shadow-sm hover:border-primary/40">
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </Link>
  );
}
