"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { apiClient, apiErrorMessage } from "@/shared/lib/api-client";
import { useUiStore } from "@/shared/lib/ui-store";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import { EnrollmentBadge } from "@/shared/components/status-badge";
import type { CompanySearchPayload, EstadoMatricula, SectorCodigo, SortDir, SortKey, TamanoEmpresa, TipoRegistro } from "@/shared/types/domain";
import { SECTOR_CODIGOS } from "@/shared/types/domain";
import { SECTOR_LABEL, TAMANO_LABEL, formatMoney } from "@/shared/utils/labels";

const ALL = "todos";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "razonSocial", label: "Empresa" },
  { key: "nit", label: "NIT" },
  { key: "sector", label: "Sector" },
  { key: "municipio", label: "Ciudad" },
  { key: "revenue", label: "Ingresos" },
  { key: "totalAssets", label: "Activos" },
  { key: "employees", label: "Empleados" },
  { key: "estadoMatricula", label: "Estado" },
];

export function CompaniesScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const user = useUiStore((state) => state.user);
  const queryClient = useQueryClient();
  const [saveOpen, setSaveOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const filters = {
    q: params.get("q") ?? "",
    tipoRegistro: (params.get("tipoRegistro") ?? "") as TipoRegistro | "",
    estadoMatricula: (params.get("estadoMatricula") ?? "") as EstadoMatricula | "",
    municipio: params.get("municipio") ?? "",
    departamento: params.get("departamento") ?? "",
    actividad: params.get("actividad") ?? "",
    tamanoEmpresa: (params.get("tamanoEmpresa") ?? "") as TamanoEmpresa | "",
    sector: (params.get("sector") ?? "") as SectorCodigo | "",
    empleadosMin: params.get("empleadosMin") ?? "",
    empleadosMax: params.get("empleadosMax") ?? "",
    ingresosMin: params.get("ingresosMin") ?? "",
    ingresosMax: params.get("ingresosMax") ?? "",
    activosMin: params.get("activosMin") ?? "",
    activosMax: params.get("activosMax") ?? "",
    sort: (params.get("sort") ?? "razonSocial") as SortKey,
    dir: (params.get("dir") ?? "asc") as SortDir,
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
  const save = useMutation({
    mutationFn: async () => {
      const filtros = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
      await apiClient.post("/api/busquedas", { nombre, filtros });
    },
    onSuccess: async () => {
      toast("Búsqueda guardada");
      setSaveOpen(false);
      setNombre("");
      await queryClient.invalidateQueries({ queryKey: ["busquedas", user?.id ?? "anon"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "No se pudo guardar la búsqueda.")),
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

  function toggleSort(key: SortKey) {
    const nextDir: SortDir = filters.sort === key && filters.dir === "asc" ? "desc" : "asc";
    const next = new URLSearchParams(params.toString());
    next.set("sort", key);
    next.set("dir", nextDir);
    router.replace(`/empresas?${next.toString()}`);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Busca por NIT, razón social, actividad o sector y ordena el padrón de demostración.</p>
        </div>
        {user?.permisos.includes("busquedas.guardar") ? (
          <Button type="button" variant="outline" onClick={() => setSaveOpen(true)}>
            Guardar búsqueda
          </Button>
        ) : null}
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
        <FilterSelect label="Departamento" value={filters.departamento || ALL} onChange={(value) => update("departamento", value)}>
          <SelectItem value={ALL}>Todos</SelectItem>
          {(query.data?.opciones.departamentos ?? []).map((departamento) => (
            <SelectItem key={departamento} value={departamento}>{departamento}</SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect label="Municipio" value={filters.municipio || ALL} onChange={(value) => update("municipio", value)}>
          <SelectItem value={ALL}>Todos</SelectItem>
          {(query.data?.opciones.municipios ?? []).map((municipio) => (
            <SelectItem key={municipio} value={municipio}>{municipio}</SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect label="Sector" value={filters.sector || ALL} onChange={(value) => update("sector", value)}>
          <SelectItem value={ALL}>Todos</SelectItem>
          {SECTOR_CODIGOS.map((sector) => (
            <SelectItem key={sector} value={sector}>{SECTOR_LABEL[sector]}</SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect label="Actividad" value={filters.actividad || ALL} onChange={(value) => update("actividad", value)}>
          <SelectItem value={ALL}>Todas</SelectItem>
          {(query.data?.opciones.actividades ?? []).map((actividad) => (
            <SelectItem key={actividad.codigo} value={actividad.codigo}>{actividad.codigo} · {actividad.descripcion}</SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect label="Tamaño" value={filters.tamanoEmpresa || ALL} onChange={(value) => update("tamanoEmpresa", value)}>
          <SelectItem value={ALL}>Todos</SelectItem>
          {(Object.keys(TAMANO_LABEL) as TamanoEmpresa[]).map((key) => (
            <SelectItem key={key} value={key}>{TAMANO_LABEL[key]}</SelectItem>
          ))}
        </FilterSelect>
        <NumberFilter label="Empleados desde" name="empleadosMin" value={filters.empleadosMin} onCommit={(value) => update("empleadosMin", value)} />
        <NumberFilter label="Empleados hasta" name="empleadosMax" value={filters.empleadosMax} onCommit={(value) => update("empleadosMax", value)} />
        <NumberFilter label="Ingresos desde" name="ingresosMin" value={filters.ingresosMin} onCommit={(value) => update("ingresosMin", value)} />
        <NumberFilter label="Ingresos hasta" name="ingresosMax" value={filters.ingresosMax} onCommit={(value) => update("ingresosMax", value)} />
        <NumberFilter label="Activos desde" name="activosMin" value={filters.activosMin} onCommit={(value) => update("activosMin", value)} />
        <NumberFilter label="Activos hasta" name="activosMax" value={filters.activosMax} onCommit={(value) => update("activosMax", value)} />
        <div className="flex items-end">
          <Button type="submit" className="h-9">Buscar</Button>
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
                  {SORTS.map((column) => {
                    const active = filters.sort === column.key;
                    const ariaSort = active ? (filters.dir === "asc" ? "ascending" : "descending") : "none";
                    return (
                      <TableHead key={column.key} aria-sort={ariaSort}>
                        <button
                          type="button"
                          className="font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                          onClick={() => toggleSort(column.key)}
                        >
                          {column.label}
                        </button>
                      </TableHead>
                    );
                  })}
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
                    <TableCell>{company.sector ? SECTOR_LABEL[company.sector] : "Sin información"}</TableCell>
                    <TableCell>{company.municipio}</TableCell>
                    <TableCell>{formatMoney(company.ingresos)}</TableCell>
                    <TableCell>{formatMoney(company.activosEstados)}</TableCell>
                    <TableCell>{company.numeroEmpleados ?? "Sin información"}</TableCell>
                    <TableCell><EnrollmentBadge estado={company.estadoMatricula} /></TableCell>
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
          <div className="grid gap-2 md:hidden">
            <FilterSelect label="Ordenar por" value={`${filters.sort}:${filters.dir}`} onChange={(value) => {
              const [sort, dir] = value.split(":");
              const next = new URLSearchParams(params.toString());
              if (sort) next.set("sort", sort);
              if (dir) next.set("dir", dir);
              router.replace(`/empresas?${next.toString()}`);
            }}>
              {SORTS.flatMap((column) => [
                <SelectItem key={`${column.key}-asc`} value={`${column.key}:asc`}>{column.label} ascendente</SelectItem>,
                <SelectItem key={`${column.key}-desc`} value={`${column.key}:desc`}>{column.label} descendente</SelectItem>,
              ])}
            </FilterSelect>
          </div>
          <ul className="grid gap-3 md:hidden">
            {query.data.items.map((company) => (
              <li key={company.id} data-testid="company-row" className="rounded-xl border bg-card p-4 shadow-sm">
                <p className="font-medium">{company.razonSocial}</p>
                <p className="text-sm text-muted-foreground">{company.nit}</p>
                <div className="mt-2 grid gap-1 text-sm">
                  <span>Sector {company.sector ? SECTOR_LABEL[company.sector] : "Sin información"}</span>
                  <span>Ciudad {company.municipio}</span>
                  <span>Ingresos {formatMoney(company.ingresos)}</span>
                  <span>Activos {formatMoney(company.activosEstados)}</span>
                  <span>Empleados {company.numeroEmpleados ?? "Sin información"}</span>
                  <EnrollmentBadge estado={company.estadoMatricula} />
                </div>
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
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar búsqueda</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="search-name">Nombre</Label>
              <Input id="search-name" value={nombre} minLength={3} maxLength={80} onChange={(event) => setNombre(event.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={nombre.trim().length < 3}>Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NumberFilter({ label, name, value, onCommit }: { label: string; name: string; value: string; onCommit: (value: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        inputMode="numeric"
        defaultValue={value}
        onBlur={(event) => {
          if (event.target.value !== value) onCommit(event.target.value);
        }}
      />
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
