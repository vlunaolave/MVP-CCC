"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterBar, FilterField, FilterGroup, type FilterChip } from "@/shared/components/filter-panel";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient, apiErrorMessage } from "@/shared/lib/api-client";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import { SeverityBadge } from "@/shared/components/status-badge";
import type { AlertItem, Severidad, TipoEvento } from "@/shared/types/domain";
import { formatDisplayDate } from "@/shared/utils/dates";
import { EVENTO_LABEL, SEVERIDAD_LABEL } from "@/shared/utils/labels";

const ALL = "todos";

export function AlertsScreen() {
  const initialCompany = useSearchParams().get("companyId") ?? "";
  const [draft, setDraft] = useState({
    desde: "",
    hasta: "",
    q: "",
    companyId: initialCompany,
    tipo: ALL,
    severidad: ALL,
    leida: ALL,
  });
  const [filters, setFilters] = useState(draft);
  const [detail, setDetail] = useState<AlertItem | null>(null);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["alerts", filters],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: AlertItem[]; noLeidas: number }>("/api/alertas", {
        params: {
          desde: filters.desde || undefined,
          hasta: filters.hasta || undefined,
          q: filters.q || undefined,
          companyId: filters.companyId || undefined,
          tipo: filters.tipo === ALL ? undefined : filters.tipo,
          severidad: filters.severidad === ALL ? undefined : filters.severidad,
          leida: filters.leida === ALL ? undefined : filters.leida,
        },
      });
      return data;
    },
  });
  const chips = alertChips(filters);
  const dirty = JSON.stringify(draft) !== JSON.stringify(filters);
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/api/alertas/${id}`, { leida: true });
    },
    onSuccess: async () => {
      toast.success("Alerta marcada como leída.");
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
      await queryClient.invalidateQueries({ queryKey: ["company"] });
    },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "No se pudo marcar la alerta.")),
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alertas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {query.data ? `${query.data.noLeidas} sin leer.` : "Cambios registrales según las reglas de demostración."}
          </p>
        </div>
      </div>
      <FilterBar
        count={chips.length}
        chips={chips}
        dirty={dirty}
        onApply={() => setFilters(draft)}
        onClear={() => {
          const empty = { desde: "", hasta: "", q: "", companyId: "", tipo: ALL, severidad: ALL, leida: ALL };
          setDraft(empty);
          setFilters(empty);
        }}
        onRemove={(id) => {
          const value = id === "desde" || id === "hasta" || id === "q" || id === "companyId" ? "" : ALL;
          const next = { ...filters, [id]: value };
          setDraft((current) => ({ ...current, [id]: value }));
          setFilters(next);
        }}
      >
        <FilterGroup title="Periodo">
          <FilterField label="Desde" pending={draft.desde !== filters.desde}>
            <Input type="date" value={draft.desde} onChange={(event) => setDraft({ ...draft, desde: event.target.value })} />
          </FilterField>
          <FilterField label="Hasta" pending={draft.hasta !== filters.hasta}>
            <Input type="date" value={draft.hasta} onChange={(event) => setDraft({ ...draft, hasta: event.target.value })} />
          </FilterField>
        </FilterGroup>
        <FilterGroup title="Empresa">
          <FilterField label="Nombre o NIT" pending={draft.q !== filters.q}>
            <Input value={draft.q} onChange={(event) => setDraft({ ...draft, q: event.target.value })} placeholder="Nombre o NIT" />
          </FilterField>
        </FilterGroup>
        <FilterGroup title="Clasificación">
          <Choice label="Tipo" value={draft.tipo} pending={draft.tipo !== filters.tipo} onChange={(tipo) => setDraft({ ...draft, tipo })}>
            <SelectItem value={ALL}>Todos</SelectItem>
            {(Object.keys(EVENTO_LABEL) as TipoEvento[]).map((tipo) => (
              <SelectItem key={tipo} value={tipo}>{EVENTO_LABEL[tipo]}</SelectItem>
            ))}
          </Choice>
          <Choice label="Severidad" value={draft.severidad} pending={draft.severidad !== filters.severidad} onChange={(severidad) => setDraft({ ...draft, severidad })}>
            <SelectItem value={ALL}>Todas</SelectItem>
            {(Object.keys(SEVERIDAD_LABEL) as Severidad[]).map((severidad) => (
              <SelectItem key={severidad} value={severidad}>{SEVERIDAD_LABEL[severidad]}</SelectItem>
            ))}
          </Choice>
          <Choice label="Lectura" value={draft.leida} pending={draft.leida !== filters.leida} onChange={(leida) => setDraft({ ...draft, leida })}>
            <SelectItem value={ALL}>Todas</SelectItem>
            <SelectItem value="false">No leídas</SelectItem>
            <SelectItem value="true">Leídas</SelectItem>
          </Choice>
        </FilterGroup>
      </FilterBar>
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.items.length === 0 ? <EmptyState title="No hay alertas con estos filtros." /> : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <div className="hidden rounded-xl border bg-card shadow-sm md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>{alert.razonSocial}</TableCell>
                    <TableCell>{alert.titulo}</TableCell>
                    <TableCell className="max-w-sm">{alert.descripcion}</TableCell>
                    <TableCell>{formatDisplayDate(alert.fecha)}</TableCell>
                    <TableCell>
                      <SeverityBadge severidad={alert.severidad} />
                    </TableCell>
                    <TableCell>
                      <AlertActions alert={alert} pending={markRead.isPending} onRead={() => markRead.mutate(alert.id)} onDetail={() => setDetail(alert)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <ul className="grid gap-3 md:hidden">
            {query.data.items.map((alert) => (
              <li key={alert.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <p className="font-medium">{alert.razonSocial}</p>
                <p className="text-sm">{alert.titulo}</p>
                <p className="mt-1 text-sm text-muted-foreground">{alert.descripcion}</p>
                <div className="mt-2 flex items-center gap-2">
                  <SeverityBadge severidad={alert.severidad} />
                  <span className="text-xs text-muted-foreground">{formatDisplayDate(alert.fecha)}</span>
                </div>
                <div className="mt-3">
                  <AlertActions alert={alert} pending={markRead.isPending} onRead={() => markRead.mutate(alert.id)} onDetail={() => setDetail(alert)} />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.titulo}</DialogTitle>
            <DialogDescription>{detail?.razonSocial}</DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-6">{detail?.descripcion}</p>
          {detail ? <SeverityBadge severidad={detail.severidad} /> : null}
          <p className="text-sm text-muted-foreground">{detail ? formatDisplayDate(detail.fecha) : ""}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertActions({
  alert,
  pending,
  onRead,
  onDetail,
}: {
  alert: AlertItem;
  pending: boolean;
  onRead: () => void;
  onDetail: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {!alert.leida ? (
        <Button type="button" size="sm" data-testid="alert-mark-read" disabled={pending} onClick={onRead}>
          Marcar leída
        </Button>
      ) : null}
      <Button asChild size="sm" variant="outline">
        <Link href={`/empresas/${alert.companyId}`}>Abrir perfil</Link>
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onDetail}>
        Ver detalle
      </Button>
    </div>
  );
}

function alertChips(filters: { desde: string; hasta: string; q: string; companyId: string; tipo: string; severidad: string; leida: string }): FilterChip[] {
  const chips: FilterChip[] = [];
  if (filters.desde) chips.push({ id: "desde", label: `Desde: ${filters.desde}` });
  if (filters.hasta) chips.push({ id: "hasta", label: `Hasta: ${filters.hasta}` });
  if (filters.q) chips.push({ id: "q", label: `Empresa: ${filters.q}` });
  if (filters.companyId) chips.push({ id: "companyId", label: "Empresa seleccionada" });
  if (filters.tipo !== ALL) chips.push({ id: "tipo", label: `Tipo: ${EVENTO_LABEL[filters.tipo as TipoEvento] ?? filters.tipo}` });
  if (filters.severidad !== ALL) chips.push({ id: "severidad", label: `Severidad: ${SEVERIDAD_LABEL[filters.severidad as Severidad] ?? filters.severidad}` });
  if (filters.leida !== ALL) chips.push({ id: "leida", label: `Lectura: ${filters.leida === "true" ? "Leídas" : "No leídas"}` });
  return chips;
}

function Choice({
  label,
  value,
  onChange,
  children,
  pending = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  pending?: boolean;
}) {
  return (
    <FilterField label={label} pending={pending}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[80]">{children}</SelectContent>
      </Select>
    </FilterField>
  );
}
