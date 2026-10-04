"use client";

import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, apiErrorMessage } from "@/shared/lib/api-client";
import { ErrorState } from "@/shared/components/screen-states";

interface Analysis {
  resumen: string;
  tendencias: string[];
  cambios: string[];
  monitorear: string[];
  sector: string[];
  aviso: string;
}

export function IntelligentAnalysis({ companyId }: { companyId: string }) {
  const generate = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<Analysis>(`/api/empresas/${companyId}/analisis`);
      return data;
    },
  });

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Análisis inteligente</h2>
          <p className="text-sm text-muted-foreground">Resume solo la información que ya está en la plataforma.</p>
        </div>
        <Button type="button" onClick={() => generate.mutate()} disabled={generate.isPending}>
          {generate.isPending ? "Generando análisis…" : generate.data ? "Regenerar análisis" : "Generar análisis"}
        </Button>
      </div>
      {generate.isPending ? <p className="text-sm text-muted-foreground">Revisando registros, estados, indicadores, alertas y comparación sectorial…</p> : null}
      {generate.isError ? <ErrorState onRetry={() => generate.mutate()} /> : null}
      {generate.error && !generate.isError ? null : null}
      {generate.isError ? <p className="text-sm text-destructive">{apiErrorMessage(generate.error, "No se pudo generar el análisis.")}</p> : null}
      {generate.data ? (
        <div className="grid gap-3">
          <Block title="Resumen ejecutivo" items={[generate.data.resumen]} />
          <Block title="Tendencias relevantes" items={generate.data.tendencias} />
          <Block title="Cambios recientes" items={generate.data.cambios} />
          <Block title="Aspectos a monitorear" items={generate.data.monitorear} />
          <Block title="Comparación frente al sector" items={generate.data.sector} />
          <p className="text-sm text-muted-foreground">{generate.data.aviso}</p>
        </div>
      ) : null}
    </section>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Sin información suficiente en este bloque.</p> : (
          <ul className="grid gap-2 text-sm leading-6">
            {items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
