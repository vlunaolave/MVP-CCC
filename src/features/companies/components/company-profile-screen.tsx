"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonitorButton } from "@/features/companies/components/monitor-button";
import { CompanyGraph } from "@/features/graph";
import { CompanyTimeline } from "@/features/timeline";
import { apiClient } from "@/shared/lib/api-client";
import { useUiStore } from "@/shared/lib/ui-store";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import { EnrollmentBadge, SeverityBadge } from "@/shared/components/status-badge";
import type { CompanyProfile, GraphPayload, RelationItem } from "@/shared/types/domain";
import { formatDisplayDate } from "@/shared/utils/dates";
import { ESTADO_JURIDICO_LABEL, ESTADO_MATRICULA_LABEL, REGISTRO_LABEL, RELACION_LABEL, TAMANO_LABEL, formatMoney } from "@/shared/utils/labels";
import { groupRelationsByPerson, personScopeLabel, vinculoLabel, vinculosEnOtrasEmpresas } from "@/shared/utils/person-relations";

export function CompanyProfileScreen({ companyId }: { companyId: string }) {
  const user = useUiStore((state) => state.user);
  const profile = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const { data } = await apiClient.get<CompanyProfile>(`/api/empresas/${companyId}`);
      return data;
    },
  });
  const canGraph = user?.permisos.includes("empresas.grafo") ?? false;
  const graph = useQuery({
    queryKey: ["company", companyId, "graph"],
    enabled: canGraph && Boolean(profile.data),
    queryFn: async () => {
      const { data } = await apiClient.get<GraphPayload>(`/api/empresas/${companyId}/grafo`);
      return data;
    },
  });

  if (profile.isLoading) {
    return <LoadingBlock rows={6} />;
  }
  if (profile.isError || !profile.data) {
    return <ErrorState onRetry={() => void profile.refetch()} />;
  }

  const company = profile.data;
  const financialEmpty = company.capital === null && company.activos === null;
  const tabs = [
    "resumen",
    "registral",
    ...(company.relaciones ? ["relaciones"] : []),
    ...(company.timeline ? ["timeline"] : []),
    ...(company.alertas ? ["alertas"] : []),
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="grid gap-2">
          <p className="text-sm text-muted-foreground">{company.nombreComercial}</p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{company.razonSocial}</h1>
          <p className="text-sm">NIT {company.nit}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <EnrollmentBadge estado={company.estadoMatricula} />
            <span>{REGISTRO_LABEL[company.tipoRegistro]}</span>
            <span>{company.actividadEconomicaCodigo} · {company.actividadEconomicaDescripcion}</span>
            <span>{company.municipio}</span>
          </div>
        </div>
        <MonitorButton companyId={company.id} monitoreada={company.monitoreada} />
      </div>
      <Tabs defaultValue="resumen">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="registral">Información registral</TabsTrigger>
          {tabs.includes("relaciones") ? <TabsTrigger value="relaciones">Relaciones</TabsTrigger> : null}
          {tabs.includes("timeline") ? <TabsTrigger value="timeline">Timeline</TabsTrigger> : null}
          {tabs.includes("alertas") ? <TabsTrigger value="alertas">Alertas</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="resumen" className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="Estado de matrícula" value={ESTADO_MATRICULA_LABEL[company.estadoMatricula]} />
            <InfoCard label="Última renovación" value={company.fechaRenovacion ? formatDisplayDate(company.fechaRenovacion) : "Sin renovación"} />
            <InfoCard label="Antigüedad" value={company.antiguedad ?? "Sin fecha de constitución"} />
            <InfoCard label="Tipo empresarial" value={company.tipoOrganizacion} />
            <InfoCard label="Actividad económica" value={`${company.actividadEconomicaCodigo} · ${company.actividadEconomicaDescripcion}`} />
            <InfoCard label="Municipio" value={`${company.municipio}, ${company.departamento}`} />
            <InfoCard label="Última actualización" value={formatDisplayDate(company.fechaUltimaActualizacion)} />
            <InfoCard label="Tamaño" value={`${TAMANO_LABEL[company.tamanoEmpresa]}${company.numeroEmpleados !== null ? ` · ${company.numeroEmpleados} empleados` : ""}`} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Resumen empresarial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6">{company.resumen}</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="registral" className="grid gap-4 md:grid-cols-2">
          <Group title="Identificación" rows={[["Razón social", company.razonSocial], ["Nombre comercial", company.nombreComercial], ["NIT", company.nit], ["Organización", company.tipoOrganizacion], ["Estado jurídico", ESTADO_JURIDICO_LABEL[company.estado]]]} />
          <Group title="Registro" rows={[["Tipo", REGISTRO_LABEL[company.tipoRegistro]], ["Matrícula", company.numeroMatricula], ["Cámara", company.camaraComercio], ["Fecha de matrícula", formatDisplayDate(company.fechaMatricula)], ["Renovación", company.fechaRenovacion ? formatDisplayDate(company.fechaRenovacion) : null], ["Constitución", company.fechaConstitucion ? formatDisplayDate(company.fechaConstitucion) : null]]} />
          <Group title="Ubicación" rows={[["Dirección", company.direccion], ["Municipio", company.municipio], ["Departamento", company.departamento], ["Teléfono", company.telefono], ["Correo", company.email], ["Sitio web", company.sitioWeb]]} />
          <Group title="Actividad económica" rows={[["Código", company.actividadEconomicaCodigo], ["Descripción", company.actividadEconomicaDescripcion], ["Tamaño", TAMANO_LABEL[company.tamanoEmpresa]], ["Empleados", company.numeroEmpleados?.toString() ?? null]]} />
          <Card>
            <CardHeader>
              <CardTitle>Información financiera disponible</CardTitle>
            </CardHeader>
            <CardContent>
              {financialEmpty ? (
                <p className="text-sm">Sin información financiera disponible</p>
              ) : (
                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4"><dt>Capital</dt><dd>{formatMoney(company.capital)}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Activos</dt><dd>{formatMoney(company.activos)}</dd></div>
                </dl>
              )}
            </CardContent>
          </Card>
          <Group title="Representación legal" rows={[["Representante legal", company.representanteLegal]]} />
        </TabsContent>
        {company.relaciones ? (
          <TabsContent value="relaciones" className="grid gap-4">
            {company.relaciones.length === 0 ? <EmptyState title="Esta empresa no tiene relaciones registradas." /> : null}
            <RelationList companyId={company.id} relations={company.relaciones} />
            {graph.isLoading ? <LoadingBlock rows={2} /> : null}
            {graph.isError ? <ErrorState onRetry={() => void graph.refetch()} /> : null}
            {graph.data ? <CompanyGraph graph={graph.data} /> : null}
          </TabsContent>
        ) : null}
        {company.timeline ? (
          <TabsContent value="timeline">
            <CompanyTimeline events={company.timeline} />
          </TabsContent>
        ) : null}
        {company.alertas ? (
          <TabsContent value="alertas" className="grid gap-3">
            {company.alertas.length === 0 ? <EmptyState title="Esta empresa no tiene alertas." /> : null}
            {company.alertas.map((alert) => (
              <article key={alert.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{alert.titulo}</h3>
                  <SeverityBadge severidad={alert.severidad} />
                </div>
                <p className="mt-1 text-sm">{alert.descripcion}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDisplayDate(alert.fecha)} · {alert.leida ? "Leída" : "No leída"}</p>
              </article>
            ))}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

function RelationList({ companyId, relations }: { companyId: string; relations: RelationItem[] }) {
  const grouped = groupRelationsByPerson(relations);
  return (
    <ul className="grid gap-3">
      {grouped.personas.map((group) => {
        const alcance = personScopeLabel(group.persona.vinculos);
        const otras = vinculosEnOtrasEmpresas(group.persona.vinculos, companyId);
        return (
          <li key={group.persona.id} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{group.persona.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {group.persona.tipoDocumento} {group.persona.numeroDocumento}
                </p>
              </div>
              {alcance ? <Badge variant="secondary">{alcance}</Badge> : null}
            </div>
            <div className="mt-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">En esta empresa</p>
              <ul className="mt-2 grid gap-2">
                {group.relaciones.map((relation) => (
                  <li key={relation.id} className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{RELACION_LABEL[relation.tipo]}</span>
                      <span className="text-xs text-muted-foreground">{relation.vigente ? "Vigente" : "No vigente"}</span>
                    </div>
                    {relation.porcentajeParticipacion !== null ? (
                      <p className="text-muted-foreground">{relation.porcentajeParticipacion} % de participación</p>
                    ) : null}
                    <p className="text-muted-foreground">{relation.descripcion}</p>
                  </li>
                ))}
              </ul>
            </div>
            {otras.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">En otras empresas</p>
                <ul className="mt-2 grid gap-2">
                  {otras.map((vinculo) => (
                    <li key={vinculo.relacionId} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span>{vinculoLabel(vinculo)}</span>
                      <Button asChild variant="link" className="h-auto px-0">
                        <Link href={`/empresas/${vinculo.companyId}`}>{vinculo.razonSocial}</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        );
      })}
      {grouped.otras.map((relation) => (
        <li key={relation.id} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              {relation.empresaRelacionada ? (
                <Link className="text-primary underline-offset-4 hover:underline" href={`/empresas/${relation.empresaRelacionada.id}`}>
                  {relation.empresaRelacionada.razonSocial}
                </Link>
              ) : (
                (relation.establecimiento?.nombre ?? RELACION_LABEL[relation.tipo])
              )}
            </p>
            <span className="text-xs text-muted-foreground">{relation.vigente ? "Vigente" : "No vigente"}</span>
          </div>
          <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">{RELACION_LABEL[relation.tipo]}</p>
          <p className="mt-1 text-sm">{relation.descripcion}</p>
        </li>
      ))}
    </ul>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
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

function Group({ title, rows }: { title: string; rows: [string, string | null | undefined][] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm">{value && value.trim() ? value : "Sin información"}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
