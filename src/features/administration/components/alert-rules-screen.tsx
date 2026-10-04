"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient, apiErrorMessage } from "@/shared/lib/api-client";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { CompanySearchPayload } from "@/shared/types/domain";
import { RULE_CATEGORIES, RULE_FIELDS, RULE_OPERATORS, fieldById, operatorLabel, type RuleCategory, type RuleOperator } from "@/shared/utils/alert-rule-catalog";
import { formatDate } from "@/shared/utils/format";

interface RuleItem {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: RuleCategory;
  categoriaLabel: string;
  campoObservado: string;
  campoLabel: string;
  condicion: RuleOperator;
  condicionLabel: string;
  valorReferencia: string | null;
  severidad: "INFORMATIVA" | "ATENCION" | "IMPORTANTE";
  activa: boolean;
  alcance: "TODAS" | "MONITOREADAS";
  updatedAt: string;
  updatedBy: string;
}

interface Preview {
  cumple: boolean;
  valorDetectado: string;
  mensaje: string;
}

const EMPTY = {
  nombre: "",
  descripcion: "",
  categoria: "FINANCIERA" as RuleCategory,
  campoObservado: "nivelEndeudamiento",
  condicion: "MAYOR_QUE" as RuleOperator,
  valor: "70",
  severidad: "IMPORTANTE" as RuleItem["severidad"],
  activa: true,
  alcance: "TODAS" as RuleItem["alcance"],
};

const SEVERIDAD: Record<RuleItem["severidad"], string> = {
  INFORMATIVA: "Informativa",
  ATENCION: "Atención",
  IMPORTANTE: "Importante",
};

export function AlertRulesScreen() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [companyId, setCompanyId] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const rules = useQuery({
    queryKey: ["admin", "reglas"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: RuleItem[] }>("/api/admin/reglas-alerta");
      return data.items;
    },
  });
  const companies = useQuery({
    queryKey: ["companies", "rule-preview"],
    queryFn: async () => {
      const { data } = await apiClient.get<CompanySearchPayload>("/api/empresas");
      return data.items;
    },
  });
  const fields = RULE_FIELDS[form.categoria];
  const field = fieldById(form.categoria, form.campoObservado) ?? fields[0];

  const payload = useMemo(() => {
    const current = fieldById(form.categoria, form.campoObservado);
    let valor = form.valor.trim();
    if (current?.kind === "percent" && form.condicion !== "VARIACION_MAYOR" && form.condicion !== "VARIACION_MENOR" && valor) {
      const number = Number(valor.replace(",", "."));
      valor = Number.isFinite(number) ? String(number / 100) : valor;
    }
    return {
      nombre: form.nombre,
      descripcion: form.descripcion,
      categoria: form.categoria,
      campoObservado: form.campoObservado,
      condicion: form.condicion,
      valorReferencia: form.condicion === "CAMBIO" ? null : valor,
      severidad: form.severidad,
      activa: form.activa,
      alcance: form.alcance,
    };
  }, [form]);

  async function refresh() {
    setPreview(null);
    await queryClient.invalidateQueries({ queryKey: ["admin", "reglas"] });
  }

  const save = useMutation({
    mutationFn: async () => {
      if (editing) await apiClient.patch(`/api/admin/reglas-alerta/${editing}`, payload);
      else await apiClient.post("/api/admin/reglas-alerta", payload);
    },
    onSuccess: async () => {
      toast.success(editing ? "Regla actualizada." : "Regla creada.");
      setEditing(null);
      setForm(EMPTY);
      await refresh();
    },
    onError: (error) => toast.error(apiErrorMessage(error, "No se pudo guardar la regla.")),
  });

  const test = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<Preview>("/api/admin/reglas-alerta/probar", { ...payload, companyId });
      return data;
    },
    onSuccess: (data) => setPreview(data),
    onError: (error) => toast.error(apiErrorMessage(error, "No se pudo probar la regla.")),
  });

  function edit(rule: RuleItem) {
    const current = fieldById(rule.categoria, rule.campoObservado);
    let valor = rule.valorReferencia ?? "";
    if (current?.kind === "percent" && rule.condicion !== "VARIACION_MAYOR" && rule.condicion !== "VARIACION_MENOR" && valor) {
      const number = Number(valor);
      if (Number.isFinite(number)) valor = String(Math.round(number * 1000) / 10);
    }
    setEditing(rule.id);
    setPreview(null);
    setForm({
      nombre: rule.nombre,
      descripcion: rule.descripcion,
      categoria: rule.categoria,
      campoObservado: rule.campoObservado,
      condicion: rule.condicion,
      valor,
      severidad: rule.severidad,
      activa: rule.activa,
      alcance: rule.alcance,
    });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Administración</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Reglas de alerta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configura cuándo se genera una alerta, sin cambiar el código.</p>
        </div>
        <Button type="button" variant="outline" asChild>
          <Link href="/administracion">Volver</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Modificar regla" : "Crear regla"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-xl border bg-muted/40 p-4 text-sm">
            <p className="font-medium">SI</p>
            <p className="mt-1">{field?.label ?? "Campo"} · {operatorLabel(form.condicion)} · {form.condicion === "CAMBIO" ? "cualquier cambio" : form.valor || "valor"}</p>
            <p className="mt-3 font-medium">ENTONCES</p>
            <p className="mt-1">Generar alerta · {SEVERIDAD[form.severidad]}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nombre">
              <Input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} />
            </Field>
            <Field label="Descripción">
              <Input value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} />
            </Field>
            <Field label="Categoría">
              <Select value={form.categoria} onValueChange={(categoria: RuleCategory) => setForm({ ...form, categoria, campoObservado: RULE_FIELDS[categoria][0]?.id ?? "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RULE_CATEGORIES.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Campo">
              <Select value={form.campoObservado} onValueChange={(campoObservado) => setForm({ ...form, campoObservado })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{fields.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Operador">
              <Select value={form.condicion} onValueChange={(condicion: RuleOperator) => setForm({ ...form, condicion })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RULE_OPERATORS.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={field?.kind === "percent" && form.condicion.startsWith("VARIACION") ? "Variación %" : field?.kind === "percent" ? "Porcentaje" : "Valor"}>
              <Input value={form.valor} disabled={form.condicion === "CAMBIO"} onChange={(event) => setForm({ ...form, valor: event.target.value })} />
            </Field>
            <Field label="Severidad">
              <Select value={form.severidad} onValueChange={(severidad: RuleItem["severidad"]) => setForm({ ...form, severidad })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SEVERIDAD).map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Estado">
              <Select value={form.activa ? "activa" : "inactiva"} onValueChange={(value) => setForm({ ...form, activa: value === "activa" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="inactiva">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Aplicar a">
              <Select value={form.alcance} onValueChange={(alcance: RuleItem["alcance"]) => setForm({ ...form, alcance })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas las empresas</SelectItem>
                  <SelectItem value="MONITOREADAS">Empresas monitoreadas</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Probar con">
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
                <SelectContent>
                  {(companies.data ?? []).map((company) => <SelectItem key={company.id} value={company.id}>{company.razonSocial}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {preview ? (
            <div className={`rounded-xl border px-4 py-3 text-sm ${preview.cumple ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
              <p className="font-medium">{preview.cumple ? "La regla se activaría." : "La empresa seleccionada no cumple actualmente esta condición."}</p>
              <p className="mt-1 text-muted-foreground">{preview.mensaje}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Guardando…" : "Guardar"}</Button>
            <Button type="button" variant="outline" onClick={() => test.mutate()} disabled={test.isPending || !companyId}>{test.isPending ? "Probando…" : "Probar regla"}</Button>
            {editing ? <Button type="button" variant="ghost" onClick={() => { setEditing(null); setForm(EMPTY); setPreview(null); }}>Cancelar</Button> : null}
          </div>
        </CardContent>
      </Card>

      {rules.isLoading ? <LoadingBlock rows={4} /> : null}
      {rules.isError ? <ErrorState onRetry={() => void rules.refetch()} /> : null}
      {rules.data && rules.data.length === 0 ? <EmptyState title="No hay reglas" /> : null}
      {rules.data && rules.data.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {["Nombre", "Evento", "Campo", "Condición", "Valor", "Severidad", "Estado", "Última modificación", "Acciones"].map((label) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.data.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.nombre}</TableCell>
                  <TableCell>{rule.categoriaLabel}</TableCell>
                  <TableCell>{rule.campoLabel}</TableCell>
                  <TableCell>{rule.condicionLabel}</TableCell>
                  <TableCell>{displayValue(rule)}</TableCell>
                  <TableCell>{SEVERIDAD[rule.severidad]}</TableCell>
                  <TableCell>{rule.activa ? "Activa" : "Inactiva"}</TableCell>
                  <TableCell>{formatDate(rule.updatedAt)} · {rule.updatedBy}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button type="button" size="sm" variant="outline" onClick={() => edit(rule)}>Editar</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void toggle(rule)}>
                        {rule.activa ? "Desactivar" : "Activar"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void copy(rule.id)}>Duplicar</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => void remove(rule)}>Eliminar</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );

  async function toggle(rule: RuleItem) {
    try {
      await apiClient.patch(`/api/admin/reglas-alerta/${rule.id}`, {
        nombre: rule.nombre,
        descripcion: rule.descripcion,
        categoria: rule.categoria,
        campoObservado: rule.campoObservado,
        condicion: rule.condicion,
        valorReferencia: rule.valorReferencia,
        severidad: rule.severidad,
        activa: !rule.activa,
        alcance: rule.alcance,
      });
      await refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudo cambiar el estado."));
    }
  }

  async function copy(id: string) {
    try {
      await apiClient.post(`/api/admin/reglas-alerta/${id}/duplicar`);
      toast.success("Regla duplicada.");
      await refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudo duplicar."));
    }
  }

  async function remove(rule: RuleItem) {
    if (!window.confirm(`¿Eliminar la regla ${rule.nombre}?`)) return;
    try {
      await apiClient.delete(`/api/admin/reglas-alerta/${rule.id}`);
      toast.success("Regla eliminada.");
      await refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudo eliminar."));
    }
  }
}

function displayValue(rule: RuleItem) {
  if (!rule.valorReferencia) return "—";
  const current = fieldById(rule.categoria, rule.campoObservado);
  const number = Number(rule.valorReferencia);
  if (!Number.isFinite(number)) return rule.valorReferencia;
  if (rule.condicion === "VARIACION_MAYOR" || rule.condicion === "VARIACION_MENOR") return `${number} %`;
  if (current?.kind === "percent") return `${Math.round(number * 1000) / 10} %`;
  return rule.valorReferencia;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
