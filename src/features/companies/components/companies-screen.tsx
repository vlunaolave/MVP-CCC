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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MonitorButton } from "@/features/companies/components/monitor-button";
import { FilterBar, FilterField, FilterGroup, type FilterChip } from "@/shared/components/filter-panel";
import { apiClient, apiErrorMessage } from "@/shared/lib/api-client";
import { useUiStore } from "@/shared/lib/ui-store";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import { EnrollmentBadge } from "@/shared/components/status-badge";
import type { CompanySearchPayload, EstadoMatricula, SectorCodigo, SortDir, SortKey, TamanoEmpresa, TipoRegistro } from "@/shared/types/domain";
import { SECTOR_CODIGOS } from "@/shared/types/domain";
import { ESTADO_MATRICULA_LABEL, REGISTRO_LABEL, SECTOR_LABEL, TAMANO_LABEL, formatMoney } from "@/shared/utils/labels";

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

type ExplorerFilters = {
  q: string;
  tipoRegistro: string;
  estadoMatricula: string;
  municipio: string;
  departamento: string;
  sector: string;
  actividad: string;
  tamanoEmpresa: string;
  empleadosMin: string;
  empleadosMax: string;
  ingresosMin: string;
  ingresosMax: string;
  activosMin: string;
  activosMax: string;
  monitoreada: string;
  unspsc: string;
  sort: SortKey;
  dir: SortDir;
};

const FILTER_KEYS = [
  "tipoRegistro",
  "estadoMatricula",
  "municipio",
  "departamento",
  "sector",
  "actividad",
  "tamanoEmpresa",
  "empleadosMin",
  "empleadosMax",
  "ingresosMin",
  "ingresosMax",
  "activosMin",
  "activosMax",
  "monitoreada",
  "unspsc",
] as const;

function readFilters(params: URLSearchParams): ExplorerFilters {
  return {
    q: params.get("q") ?? "",
    tipoRegistro: params.get("tipoRegistro") ?? "",
    estadoMatricula: params.get("estadoMatricula") ?? "",
    municipio: params.get("municipio") ?? "",
    departamento: params.get("departamento") ?? "",
    sector: params.get("sector") ?? "",
    actividad: params.get("actividad") ?? "",
    tamanoEmpresa: params.get("tamanoEmpresa") ?? "",
    empleadosMin: params.get("empleadosMin") ?? "",
    empleadosMax: params.get("empleadosMax") ?? "",
    ingresosMin: params.get("ingresosMin") ?? "",
    ingresosMax: params.get("ingresosMax") ?? "",
    activosMin: params.get("activosMin") ?? "",
    activosMax: params.get("activosMax") ?? "",
    monitoreada: params.get("monitoreada") ?? "",
    unspsc: params.get("unspsc") ?? "",
    sort: (params.get("sort") ?? "razonSocial") as SortKey,
    dir: (params.get("dir") ?? "asc") as SortDir,
  };
}

export function CompaniesScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const user = useUiStore((state) => state.user);
  const queryClient = useQueryClient();
  const [saveOpen, setSaveOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const filters = readFilters(params);
  const [draft, setDraft] = useState(filters);
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
  const chips = companyChips(filters, query.data);
  const dirty = FILTER_KEYS.some((key) => draft[key] !== filters[key]);

  function push(next: ExplorerFilters) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) {
        search.set(key, value);
      }
    }
    if (next.sort === "razonSocial") {
      search.delete("sort");
    }
    if (next.dir === "asc") {
      search.delete("dir");
    }
    router.replace(`/empresas?${search.toString()}`);
  }

  function update(key: string, value: string) {
    const next = { ...filters, [key]: !value || value === ALL ? "" : value };
    push(next as ExplorerFilters);
  }

  function applyFilters() {
    push({ ...filters, ...draft, q: filters.q, sort: filters.sort, dir: filters.dir });
  }

  function clearFilters() {
    const next = { ...filters, q: "" };
    for (const key of FILTER_KEYS) {
      next[key] = "";
    }
    setDraft(next);
    push(next);
  }

  function removeChip(id: string) {
    const cleared: Partial<ExplorerFilters> = {};
    if (id === "q") {
      cleared.q = "";
    } else if (id === "empleados") {
      cleared.empleadosMin = "";
      cleared.empleadosMax = "";
    } else if (id === "ingresos") {
      cleared.ingresosMin = "";
      cleared.ingresosMax = "";
    } else if (id === "activos") {
      cleared.activosMin = "";
      cleared.activosMax = "";
    } else if (id === "sector") {
      cleared.sector = "";
    } else if (id === "actividad") {
      cleared.actividad = "";
    } else if (id === "tamanoEmpresa") {
      cleared.tamanoEmpresa = "";
    } else if (id === "tipoRegistro") {
      cleared.tipoRegistro = "";
    } else if (id === "estadoMatricula") {
      cleared.estadoMatricula = "";
    } else if (id === "monitoreada") {
      cleared.monitoreada = "";
    } else if (id === "municipio") {
      cleared.municipio = "";
    } else if (id === "departamento") {
      cleared.departamento = "";
    } else if (id === "unspsc") {
      cleared.unspsc = "";
    }
    setDraft((current) => ({ ...current, ...cleared }));
    push({ ...filters, ...cleared });
  }

  function toggleSort(key: SortKey) {
    const nextDir: SortDir = filters.sort === key && filters.dir === "asc" ? "desc" : "asc";
    push({ ...filters, sort: key, dir: nextDir });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Explorador</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Busca por NIT, razón social, actividad o sector y ordena el padrón de demostración.</p>
        </div>
        {user?.permisos.includes("busquedas.guardar") ? (
          <Button type="button" variant="outline" onClick={() => setSaveOpen(true)}>
            Guardar búsqueda
          </Button>
        ) : null}
      </div>
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          update("q", String(data.get("q") ?? ""));
        }}
      >
        <div className="grid min-w-0 flex-1 gap-1.5">
          <Label htmlFor="company-search">Búsqueda</Label>
          <Input
            id="company-search"
            name="q"
            key={filters.q}
            data-testid="company-search"
            defaultValue={filters.q}
            placeholder="Buscar empresa por nombre, NIT, actividad o sector"
            className="h-11 rounded-xl bg-white"
          />
        </div>
        <Button type="submit" className="h-11 rounded-xl">Buscar</Button>
      </form>
      <FilterBar count={chips.length} chips={chips} dirty={dirty} onApply={applyFilters} onClear={clearFilters} onRemove={removeChip}>
        <FilterGroup title="Ubicación">
          <Choice label="Departamento" value={draft.departamento || ALL} pending={draft.departamento !== filters.departamento} onChange={(departamento) => setDraft({ ...draft, departamento: departamento === ALL ? "" : departamento })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            {(query.data?.opciones.departamentos ?? []).map((departamento) => (
              <SelectItem key={departamento} value={departamento}>{departamento}</SelectItem>
            ))}
          </Choice>
          <Choice label="Municipio" value={draft.municipio || ALL} pending={draft.municipio !== filters.municipio} onChange={(municipio) => setDraft({ ...draft, municipio: municipio === ALL ? "" : municipio })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            {(query.data?.opciones.municipios ?? []).map((municipio) => (
              <SelectItem key={municipio} value={municipio}>{municipio}</SelectItem>
            ))}
          </Choice>
        </FilterGroup>
        <FilterGroup title="Clasificación">
          <Choice label="Sector" value={draft.sector || ALL} pending={draft.sector !== filters.sector} onChange={(sector) => setDraft({ ...draft, sector: sector === ALL ? "" : sector })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            {SECTOR_CODIGOS.map((sector) => (
              <SelectItem key={sector} value={sector}>{SECTOR_LABEL[sector]}</SelectItem>
            ))}
          </Choice>
          <Choice label="Actividad económica" value={draft.actividad || ALL} pending={draft.actividad !== filters.actividad} onChange={(actividad) => setDraft({ ...draft, actividad: actividad === ALL ? "" : actividad })}>
            <SelectItem value={ALL}>Todas</SelectItem>
            {(query.data?.opciones.actividades ?? []).map((actividad) => (
              <SelectItem key={actividad.codigo} value={actividad.codigo}>{actividad.codigo} · {actividad.descripcion}</SelectItem>
            ))}
          </Choice>
          <FilterField label="Código UNSPSC" pending={draft.unspsc !== filters.unspsc}>
            <Input id="unspsc" name="unspsc" value={draft.unspsc} placeholder="Ej. 43232304" onChange={(event) => setDraft({ ...draft, unspsc: event.target.value })} />
          </FilterField>
          <Choice label="Tamaño" value={draft.tamanoEmpresa || ALL} pending={draft.tamanoEmpresa !== filters.tamanoEmpresa} onChange={(tamanoEmpresa) => setDraft({ ...draft, tamanoEmpresa: tamanoEmpresa === ALL ? "" : tamanoEmpresa })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            {(Object.keys(TAMANO_LABEL) as TamanoEmpresa[]).map((key) => (
              <SelectItem key={key} value={key}>{TAMANO_LABEL[key]}</SelectItem>
            ))}
          </Choice>
        </FilterGroup>
        <FilterGroup title="Finanzas">
          <NumberFilter label="Empleados desde" name="empleadosMin" value={draft.empleadosMin} pending={draft.empleadosMin !== filters.empleadosMin} onChange={(empleadosMin) => setDraft({ ...draft, empleadosMin })} />
          <NumberFilter label="Empleados hasta" name="empleadosMax" value={draft.empleadosMax} pending={draft.empleadosMax !== filters.empleadosMax} onChange={(empleadosMax) => setDraft({ ...draft, empleadosMax })} />
          <NumberFilter label="Rango de ingresos desde" name="ingresosMin" value={draft.ingresosMin} pending={draft.ingresosMin !== filters.ingresosMin} onChange={(ingresosMin) => setDraft({ ...draft, ingresosMin })} />
          <NumberFilter label="Rango de ingresos hasta" name="ingresosMax" value={draft.ingresosMax} pending={draft.ingresosMax !== filters.ingresosMax} onChange={(ingresosMax) => setDraft({ ...draft, ingresosMax })} />
          <NumberFilter label="Rango de activos desde" name="activosMin" value={draft.activosMin} pending={draft.activosMin !== filters.activosMin} onChange={(activosMin) => setDraft({ ...draft, activosMin })} />
          <NumberFilter label="Rango de activos hasta" name="activosMax" value={draft.activosMax} pending={draft.activosMax !== filters.activosMax} onChange={(activosMax) => setDraft({ ...draft, activosMax })} />
        </FilterGroup>
        <FilterGroup title="Estado">
          <Choice label="Tipo de registro" value={draft.tipoRegistro || ALL} pending={draft.tipoRegistro !== filters.tipoRegistro} testId="filter-tipo" onChange={(tipoRegistro) => setDraft({ ...draft, tipoRegistro: tipoRegistro === ALL ? "" : tipoRegistro })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            <SelectItem value="MERCANTIL">Registro Mercantil</SelectItem>
            <SelectItem value="ESAL">ESAL</SelectItem>
          </Choice>
          <Choice label="Estado empresarial" value={draft.estadoMatricula || ALL} pending={draft.estadoMatricula !== filters.estadoMatricula} onChange={(estadoMatricula) => setDraft({ ...draft, estadoMatricula: estadoMatricula === ALL ? "" : estadoMatricula })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            <SelectItem value="ACTIVA">Activa</SelectItem>
            <SelectItem value="SUSPENDIDA">Suspendida</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
            <SelectItem value="INACTIVA">Inactiva</SelectItem>
          </Choice>
          <Choice label="Monitoreada" value={draft.monitoreada || ALL} pending={draft.monitoreada !== filters.monitoreada} onChange={(monitoreada) => setDraft({ ...draft, monitoreada: monitoreada === ALL ? "" : monitoreada })}>
            <SelectItem value={ALL}>Todas</SelectItem>
            <SelectItem value="true">Sí</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </Choice>
        </FilterGroup>
      </FilterBar>
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.items.length === 0 ? (
        <EmptyState title="Ninguna empresa coincide con la búsqueda." description="Prueba con otro NIT, otra razón social o limpia los filtros." />
      ) : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">{query.data.total} empresas en el resultado.</p>
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm md:block">
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
            <FilterField label="Ordenar por">
              <Select
                value={`${filters.sort}:${filters.dir}`}
                onValueChange={(value) => {
                  const [sort, dir] = value.split(":");
                  push({ ...filters, sort: (sort ?? "razonSocial") as SortKey, dir: (dir ?? "asc") as SortDir });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.flatMap((column) => [
                    <SelectItem key={`${column.key}-asc`} value={`${column.key}:asc`}>{column.label} ascendente</SelectItem>,
                    <SelectItem key={`${column.key}-desc`} value={`${column.key}:desc`}>{column.label} descendente</SelectItem>,
                  ])}
                </SelectContent>
              </Select>
            </FilterField>
          </div>
          <ul className="grid gap-3 md:hidden">
            {query.data.items.map((company) => (
              <li key={company.id} data-testid="company-row" className="rounded-2xl border bg-card p-4 shadow-sm">
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

function companyChips(filters: ExplorerFilters, data: CompanySearchPayload | undefined): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.q) chips.push({ id: "q", label: `Búsqueda: ${filters.q}` });
  if (filters.departamento) chips.push({ id: "departamento", label: `Departamento: ${filters.departamento}` });
  if (filters.municipio) chips.push({ id: "municipio", label: `Ciudad: ${filters.municipio}` });
  if (filters.sector) chips.push({ id: "sector", label: `Sector: ${SECTOR_LABEL[filters.sector as SectorCodigo] ?? filters.sector}` });
  if (filters.actividad) {
    const match = data?.opciones.actividades.find((item) => item.codigo === filters.actividad);
    chips.push({ id: "actividad", label: `Actividad: ${match ? match.descripcion : filters.actividad}` });
  }
  if (filters.tamanoEmpresa) chips.push({ id: "tamanoEmpresa", label: `Tamaño: ${TAMANO_LABEL[filters.tamanoEmpresa as TamanoEmpresa] ?? filters.tamanoEmpresa}` });
  if (filters.empleadosMin || filters.empleadosMax) chips.push({ id: "empleados", label: rangeLabel("Empleados", filters.empleadosMin, filters.empleadosMax) });
  if (filters.ingresosMin || filters.ingresosMax) chips.push({ id: "ingresos", label: rangeLabel("Ingresos", filters.ingresosMin, filters.ingresosMax) });
  if (filters.activosMin || filters.activosMax) chips.push({ id: "activos", label: rangeLabel("Activos", filters.activosMin, filters.activosMax) });
  if (filters.tipoRegistro) chips.push({ id: "tipoRegistro", label: `Tipo: ${REGISTRO_LABEL[filters.tipoRegistro as TipoRegistro] ?? filters.tipoRegistro}` });
  if (filters.estadoMatricula) chips.push({ id: "estadoMatricula", label: `Estado: ${ESTADO_MATRICULA_LABEL[filters.estadoMatricula as EstadoMatricula] ?? filters.estadoMatricula}` });
  if (filters.monitoreada) chips.push({ id: "monitoreada", label: `Monitoreada: ${filters.monitoreada === "true" ? "Sí" : "No"}` });
  if (filters.unspsc) chips.push({ id: "unspsc", label: `UNSPSC: ${filters.unspsc}` });
  return chips;
}

function rangeLabel(prefix: string, min: string, max: string) {
  const compact = (value: string) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return value;
    return new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(number);
  };
  if (min && max) return `${prefix}: ${compact(min)}–${compact(max)}`;
  if (min) return `${prefix}: desde ${compact(min)}`;
  return `${prefix}: hasta ${compact(max)}`;
}

function NumberFilter({
  label,
  name,
  value,
  pending,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  pending: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <FilterField label={label} pending={pending}>
      <Input id={name} name={name} type="number" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} />
    </FilterField>
  );
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
