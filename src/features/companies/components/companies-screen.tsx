"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MonitorButton } from "@/features/companies/components/monitor-button";
import { apiClient } from "@/shared/lib/api-client";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import { EnrollmentBadge } from "@/shared/components/status-badge";
import type { CompanySearchPayload, EstadoMatricula, TamanoEmpresa, TipoRegistro } from "@/shared/types/domain";
import { formatDisplayDate } from "@/shared/utils/dates";
import { REGISTRO_LABEL, TAMANO_LABEL } from "@/shared/utils/labels";

const ALL = "todos";

export function CompaniesScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const filters = {
    q: params.get("q") ?? "",
    tipoRegistro: (params.get("tipoRegistro") ?? "") as TipoRegistro | "",
    estadoMatricula: (params.get("estadoMatricula") ?? "") as EstadoMatricula | "",
    municipio: params.get("municipio") ?? "",
    actividad: params.get("actividad") ?? "",
    tamanoEmpresa: (params.get("tamanoEmpresa") ?? "") as TamanoEmpresa | "",
  };
  const query = useQuery({
    queryKey: ["companies", filters],
    queryFn: async () => {
      const { data } = await apiClient.get<CompanySearchPayload>("/api/empresas", {
        params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
      });
      return data;
    },
  });

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ALL) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.replace(`/empresas?${next.toString()}`);
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Busca por NIT, razón social o nombre comercial y afina con los filtros del registro.</p>
      </div>
      <form
        className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          update("q", String(data.get("q") ?? ""));
        }}
      >
        <div className="grid gap-1.5 md:col-span-3">
          <Label htmlFor="company-search">Búsqueda</Label>
          <Input
            id="company-search"
            name="q"
            data-testid="company-search"
            defaultValue={filters.q}
            placeholder="NIT, razón social o nombre comercial"
          />
        </div>
        <FilterSelect label="Tipo de registro" value={filters.tipoRegistro || ALL} onChange={(value) => update("tipoRegistro", value)} testId="filter-tipo">
          <SelectItem value={ALL}>Todos</SelectItem>
          <SelectItem value="MERCANTIL">Registro Mercantil</SelectItem>
          <SelectItem value="ESAL">ESAL</SelectItem>
        </FilterSelect>
        <FilterSelect label="Estado de matrícula" value={filters.estadoMatricula || ALL} onChange={(value) => update("estadoMatricula", value)}>
          <SelectItem value={ALL}>Todos</SelectItem>
          <SelectItem value="ACTIVA">Activa</SelectItem>
          <SelectItem value="SUSPENDIDA">Suspendida</SelectItem>
          <SelectItem value="CANCELADA">Cancelada</SelectItem>
          <SelectItem value="INACTIVA">Inactiva</SelectItem>
        </FilterSelect>
        <FilterSelect label="Municipio" value={filters.municipio || ALL} onChange={(value) => update("municipio", value)}>
          <SelectItem value={ALL}>Todos</SelectItem>
          {(query.data?.opciones.municipios ?? []).map((municipio) => (
            <SelectItem key={municipio} value={municipio}>
              {municipio}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect label="Actividad" value={filters.actividad || ALL} onChange={(value) => update("actividad", value)}>
          <SelectItem value={ALL}>Todas</SelectItem>
          {(query.data?.opciones.actividades ?? []).map((actividad) => (
            <SelectItem key={actividad.codigo} value={actividad.codigo}>
              {actividad.codigo} · {actividad.descripcion}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect label="Tamaño" value={filters.tamanoEmpresa || ALL} onChange={(value) => update("tamanoEmpresa", value)}>
          <SelectItem value={ALL}>Todos</SelectItem>
          {(Object.keys(TAMANO_LABEL) as TamanoEmpresa[]).map((key) => (
            <SelectItem key={key} value={key}>
              {TAMANO_LABEL[key]}
            </SelectItem>
          ))}
        </FilterSelect>
        <div className="flex items-end">
          <Button type="submit" className="h-9">
            Buscar
          </Button>
        </div>
      </form>
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.items.length === 0 ? (
        <EmptyState title="Ninguna empresa coincide con la búsqueda." description="Prueba con otro NIT, otra razón social o limpia los filtros." />
      ) : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>NIT</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Actividad</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última actualización</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((company) => (
                  <TableRow key={company.id} data-testid="company-row">
                    <TableCell>
                      <p className="font-medium">{company.razonSocial}</p>
                      {company.nombreComercial ? <p className="text-xs text-muted-foreground">{company.nombreComercial}</p> : null}
                    </TableCell>
                    <TableCell>{company.nit}</TableCell>
                    <TableCell>{REGISTRO_LABEL[company.tipoRegistro]}</TableCell>
                    <TableCell className="max-w-56">
                      <span className="line-clamp-2">{company.actividadEconomicaCodigo} · {company.actividadEconomicaDescripcion}</span>
                    </TableCell>
                    <TableCell>{company.municipio}</TableCell>
                    <TableCell>
                      <EnrollmentBadge estado={company.estadoMatricula} />
                    </TableCell>
                    <TableCell>{formatDisplayDate(company.fechaUltimaActualizacion)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/empresas/${company.id}`}>Ver perfil</Link>
                        </Button>
                        <MonitorButton companyId={company.id} monitoreada={company.monitoreada} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="grid gap-3 md:hidden">
            {query.data.items.map((company) => (
              <li key={company.id} data-testid="company-row" className="rounded-xl border bg-card p-4 shadow-sm">
                <p className="font-medium">{company.razonSocial}</p>
                <p className="text-sm text-muted-foreground">{company.nit}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span>{REGISTRO_LABEL[company.tipoRegistro]}</span>
                  <span>{company.municipio}</span>
                  <EnrollmentBadge estado={company.estadoMatricula} />
                </div>
                <p className="mt-2 text-sm">{company.actividadEconomicaDescripcion}</p>
                <p className="mt-1 text-xs text-muted-foreground">Actualizada {formatDisplayDate(company.fechaUltimaActualizacion)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/empresas/${company.id}`}>Ver perfil</Link>
                  </Button>
                  <MonitorButton companyId={company.id} monitoreada={company.monitoreada} />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function FilterSelect({
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
