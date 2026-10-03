"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancePanel } from "@/features/companies/components/finance-panel";
import { MonitorButton } from "@/features/companies/components/monitor-button";
import { CompareButton, SectorComparison, SimilarCompanies } from "@/features/comparison";
import { CompanyGraph } from "@/features/graph";
import { AddToListDialog } from "@/features/lists";
import { CompanyTimeline } from "@/features/timeline";
import { apiClient } from "@/shared/lib/api-client";
import { useUiStore } from "@/shared/lib/ui-store";
import { CoverageList } from "@/shared/components/coverage-list";
import { DataSourceBadge } from "@/shared/components/data-source-badge";
import { LastUpdatedLabel } from "@/shared/components/last-updated-label";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import { EnrollmentBadge, SeverityBadge } from "@/shared/components/status-badge";
import type { CompanyProfile, FinancePayload, GraphPayload, RelationItem } from "@/shared/types/domain";
import { formatDisplayDate } from "@/shared/utils/dates";
import { DIRECTIVE_TYPES } from "@/shared/utils/event-category";
import { formatVariation } from "@/server/services/financial-indicators";
import {
  ESTADO_JURIDICO_LABEL,
  RELACION_LABEL,
  SECTOR_LABEL,
  TAMANO_LABEL,
  formatMoney,
} from "@/shared/utils/labels";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { groupRelationsByPerson, personScopeLabel, vinculoLabel, vinculosEnOtrasEmpresas } from "@/shared/utils/person-relations";

const LINK_TYPES = new Set(["EMPRESA_RELACIONADA", "MATRIZ", "SUBSIDIARIA"]);

function cargoLabel(relation: RelationItem): string {
  if (relation.cargo) {
    return relation.cargo;
  }
  return RELACION_LABEL[relation.tipo];
}

function downloadCsv(company: CompanyProfile, finanzas: FinancePayload | undefined) {
  const lines = ["Datos de demostración"];
  const push = (label: string, value: string | null | undefined) => {
    lines.push([csv(label), csv(value && value.trim() ? value : "Sin información")].join(","));
  };
  push("Razón social", company.razonSocial);
  push("NIT", company.nit);
  push("Sector", SECTOR_LABEL[company.sector]);
  push("Ciudad", company.municipio);
  push("Actividad", `${company.actividadEconomicaCodigo} ${company.actividadEconomicaDescripcion}`);
  push("Matrícula", company.numeroMatricula);
  push("Capital registral", formatMoney(company.capital));
  push("Activos registrales", formatMoney(company.activos));
  if (finanzas) {
    for (const period of finanzas.periodos) {
      push(`Ingresos ${period.year}`, formatMoney(period.revenue));
      push(`Utilidad ${period.year}`, formatMoney(period.netProfit));
      push(`Activos estados ${period.year}`, formatMoney(period.totalAssets));
    }
  }
  if (company.relaciones) {
    for (const relation of company.relaciones) {
      const name = relation.persona?.nombre ?? relation.empresaRelacionada?.razonSocial ?? relation.establecimiento?.nombre ?? relation.descripcion;
      push(RELACION_LABEL[relation.tipo], name);
    }
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${company.nit}-demostracion.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function CompanyProfileScreen({ companyId }: { companyId: string }) {
  const user = useUiStore((state) => state.user);
  const profile = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const { data } = await apiClient.get<CompanyProfile>(`/api/empresas/${companyId}`);
      return data;
    },
  });
  const finances = useQuery({
    queryKey: ["company", companyId, "finanzas"],
    enabled: Boolean(profile.data),
    queryFn: async () => {
      const { data } = await apiClient.get<FinancePayload>(`/api/empresas/${companyId}/finanzas`);
      return data;
    },
  });
  const canGraph = user?.permisos.includes("empresas.grafo") ?? false;
  const graph = useQuery({
    queryKey: ["company", companyId, "graph"],
    enabled: canGraph && Boolean(profile.data?.relaciones),
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
  const ultimo = company.ultimoPeriodo;
  const directivos = (company.relaciones ?? []).filter((relation) => DIRECTIVE_TYPES.has(relation.tipo));
  const accionistas = (company.relaciones ?? []).filter((relation) => relation.tipo === "SOCIO");
  const vinculadas = (company.relaciones ?? []).filter((relation) => LINK_TYPES.has(relation.tipo));
  const chart = (finances.data?.periodos ?? []).map((period) => ({ year: String(period.year), ingresos: period.revenue }));

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="grid gap-2">
          <DataSourceBadge />
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{company.razonSocial}</h1>
          <p className="text-sm">NIT {company.nit}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <EnrollmentBadge estado={company.estadoMatricula} />
            <span>{company.municipio}</span>
            <span>{SECTOR_LABEL[company.sector]}</span>
            <span>{company.actividadEconomicaCodigo} · {company.actividadEconomicaDescripcion}</span>
          </div>
          <LastUpdatedLabel value={company.fechaUltimaActualizacion} />
        </div>
        <div className="flex flex-wrap gap-2">
          <MonitorButton companyId={company.id} monitoreada={company.monitoreada} />
          <CompareButton companyId={company.id} />
          <Button type="button" variant="outline" onClick={() => downloadCsv(company, finances.data)}>
            Exportar
          </Button>
          <AddToListDialog companyId={company.id} />
        </div>
      </div>
      <Tabs defaultValue="resumen">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="registral">Datos registrales</TabsTrigger>
          <TabsTrigger value="finanzas">Finanzas</TabsTrigger>
          {company.relaciones ? <TabsTrigger value="directivos">Directivos y propiedad</TabsTrigger> : null}
          {company.relaciones ? <TabsTrigger value="relaciones">Relaciones</TabsTrigger> : null}
          <TabsTrigger value="comparacion">Comparación</TabsTrigger>
          {company.timeline ? <TabsTrigger value="timeline">Timeline</TabsTrigger> : null}
          {company.alertas ? <TabsTrigger value="alertas">Alertas</TabsTrigger> : null}
        </TabsList>
        <TabsContent value="resumen" className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi label="Ingresos" value={formatMoney(ultimo?.ingresos ?? null)} variation={formatVariation(ultimo?.variacionIngresos ?? null, ultimo?.anioAnterior ?? null)} />
            <Kpi label={ultimo ? `Activos (estados ${ultimo.year})` : "Activos"} value={formatMoney(ultimo?.activos ?? null)} variation={formatVariation(ultimo?.variacionActivos ?? null, ultimo?.anioAnterior ?? null)} />
            <Kpi label="Patrimonio" value={formatMoney(ultimo?.patrimonio ?? null)} variation={formatVariation(ultimo?.variacionPatrimonio ?? null, ultimo?.anioAnterior ?? null)} />
            <Kpi label="Utilidad" value={formatMoney(ultimo?.utilidad ?? null)} variation={formatVariation(ultimo?.variacionUtilidad ?? null, ultimo?.anioAnterior ?? null)} />
            <Kpi
              label="Empleados"
              value={String(ultimo?.empleados ?? company.numeroEmpleados ?? "Sin información")}
              variation={ultimo ? formatVariation(ultimo.variacionEmpleados, ultimo.anioAnterior) : ""}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Resumen empresarial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6">{company.resumen}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Datos clave</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Fact label="Matrícula" value={company.numeroMatricula} />
              <Fact label="Actividad" value={`${company.actividadEconomicaCodigo} · ${company.actividadEconomicaDescripcion}`} />
              <Fact label="Tamaño" value={TAMANO_LABEL[company.tamanoEmpresa]} />
              <Fact label="Ciudad" value={`${company.municipio}, ${company.departamento}`} />
              <Fact label="Antigüedad" value={company.antiguedad ?? "Sin fecha de constitución"} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Evolución de ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              {finances.isLoading ? <LoadingBlock rows={2} /> : null}
              {finances.isError ? <ErrorState onRetry={() => void finances.refetch()} /> : null}
              {finances.data && chart.length === 0 ? <EmptyState title="Sin información financiera disponible" /> : null}
              {chart.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} width={72} />
                      <Tooltip />
                      <Bar dataKey="ingresos" name="Ingresos" fill="var(--chart-1)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}
            </CardContent>
          </Card>
          {company.timeline ? (
            <Card>
              <CardHeader>
                <CardTitle>Eventos recientes</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {company.timeline.slice(0, 4).map((event) => (
                  <div key={event.id}>
                    <p className="text-sm font-medium">{event.titulo}</p>
                    <p className="text-xs text-muted-foreground">{formatDisplayDate(event.fecha)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {company.alertas ? (
            <Card>
              <CardHeader>
                <CardTitle>Alertas recientes</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {company.alertas.length === 0 ? <p className="text-sm">Esta empresa no tiene alertas.</p> : null}
                {company.alertas.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{alert.titulo}</p>
                      <p className="text-xs text-muted-foreground">{formatDisplayDate(alert.fecha)}</p>
                    </div>
                    <SeverityBadge severidad={alert.severidad} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Empresas similares</CardTitle>
            </CardHeader>
            <CardContent>
              <SimilarCompanies companyId={company.id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cobertura</CardTitle>
            </CardHeader>
            <CardContent>
              <CoverageList cobertura={company.cobertura} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="registral" className="grid gap-4 md:grid-cols-2">
          <Group title="Identificación" rows={[["Razón social", company.razonSocial], ["Nombre comercial", company.nombreComercial], ["NIT", company.nit], ["Organización", company.tipoOrganizacion], ["Estado jurídico", ESTADO_JURIDICO_LABEL[company.estado]]]} />
          <Group title="Registro" rows={[["Tipo", company.tipoRegistro === "ESAL" ? "ESAL" : "Registro Mercantil"], ["Matrícula", company.numeroMatricula], ["Cámara", company.camaraComercio], ["Fecha de matrícula", formatDisplayDate(company.fechaMatricula)], ["Renovación", company.fechaRenovacion ? formatDisplayDate(company.fechaRenovacion) : null], ["Constitución", company.fechaConstitucion ? formatDisplayDate(company.fechaConstitucion) : null]]} />
          <Group title="Ubicación" rows={[["Dirección", company.direccion], ["Municipio", company.municipio], ["Departamento", company.departamento], ["Teléfono", company.telefono], ["Correo", company.email], ["Sitio web", company.sitioWeb]]} />
          <Group title="Actividad económica" rows={[["Código", company.actividadEconomicaCodigo], ["Descripción", company.actividadEconomicaDescripcion], ["Sector", SECTOR_LABEL[company.sector]], ["Tamaño", TAMANO_LABEL[company.tamanoEmpresa]], ["Empleados", company.numeroEmpleados?.toString() ?? null]]} />
          <Card>
            <CardHeader>
              <CardTitle>Información financiera registral</CardTitle>
            </CardHeader>
            <CardContent>
              {financialEmpty ? (
                <p className="text-sm">Sin información financiera disponible</p>
              ) : (
                <dl className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4"><dt>Capital registral</dt><dd>{formatMoney(company.capital)}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Activos registrales</dt><dd>{formatMoney(company.activos)}</dd></div>
                </dl>
              )}
            </CardContent>
          </Card>
          <Group title="Representación legal" rows={[["Representante legal", company.representanteLegal]]} />
        </TabsContent>
        <TabsContent value="finanzas">
          <FinancePanel companyId={company.id} />
        </TabsContent>
        {company.relaciones ? (
          <TabsContent value="directivos" className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Directivos</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {directivos.length === 0 ? <p className="text-sm">Esta empresa no tiene directivos registrados.</p> : null}
                {directivos.map((relation) => (
                  <div key={relation.id} className="rounded-lg border px-3 py-2">
                    <p className="text-sm font-medium">{relation.persona?.nombre ?? relation.descripcion}</p>
                    <p className="text-sm text-muted-foreground">{cargoLabel(relation)} · {relation.vigente ? "Vigente" : "No vigente"} · desde {formatDisplayDate(relation.fechaInicio)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Accionistas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {accionistas.length === 0 ? <p className="text-sm">Esta empresa no tiene accionistas registrados.</p> : null}
                {accionistas.map((relation) => (
                  <div key={relation.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                    <p className="text-sm font-medium">{relation.persona?.nombre ?? relation.descripcion}</p>
                    <p className="text-sm">{relation.porcentajeParticipacion === null ? "Sin información" : `${relation.porcentajeParticipacion} %`}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}
        {company.relaciones ? (
          <TabsContent value="relaciones" className="grid gap-4">
            {company.relaciones.length === 0 ? <EmptyState title="Esta empresa no tiene relaciones registradas." /> : null}
            <RelationList companyId={company.id} relations={company.relaciones} />
            <Card>
              <CardHeader>
                <CardTitle>Empresas relacionadas</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {vinculadas.length === 0 ? <p className="text-sm">Esta empresa no tiene vínculos con otras empresas.</p> : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        {["Empresa", "NIT", "Tipo de vínculo", "Participación", "Vigencia", "Ver perfil"].map((label) => (
                          <th key={label} className="py-2 pr-3 font-medium">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vinculadas.map((relation) => (
                        <tr key={relation.id} className="border-b last:border-0">
                          <td className="py-2 pr-3">{relation.empresaRelacionada?.razonSocial ?? "Sin información"}</td>
                          <td className="py-2 pr-3">{relation.empresaRelacionada?.nit ?? "Sin información"}</td>
                          <td className="py-2 pr-3">{RELACION_LABEL[relation.tipo]}</td>
                          <td className="py-2 pr-3">{relation.porcentajeParticipacion === null ? "Sin información" : `${relation.porcentajeParticipacion} %`}</td>
                          <td className="py-2 pr-3">{relation.vigente ? "Vigente" : "No vigente"}</td>
                          <td className="py-2">
                            {relation.empresaRelacionada ? (
                              <Button asChild variant="link" className="h-auto px-0">
                                <Link href={`/empresas/${relation.empresaRelacionada.id}`}>Ver perfil</Link>
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
            {graph.isLoading ? <LoadingBlock rows={2} /> : null}
            {graph.isError ? <ErrorState onRetry={() => void graph.refetch()} /> : null}
            {graph.data ? <CompanyGraph graph={graph.data} /> : null}
          </TabsContent>
        ) : null}
        <TabsContent value="comparacion" className="grid gap-4">
          <SectorComparison companyId={company.id} />
          <Card>
            <CardHeader>
              <CardTitle>Empresas similares</CardTitle>
            </CardHeader>
            <CardContent>
              <SimilarCompanies companyId={company.id} />
            </CardContent>
          </Card>
        </TabsContent>
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
                      <span className="font-medium">{cargoLabel(relation)}</span>
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

function Kpi({ label, value, variation }: { label: string; value: string; variation: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium">{value}</p>
        {variation ? <p className="text-xs text-muted-foreground">{variation}</p> : null}
      </CardContent>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
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
