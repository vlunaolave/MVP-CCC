"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/shared/lib/api-client";
import { DataSourceBadge } from "@/shared/components/data-source-badge";
import { ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { SectorResumen } from "@/shared/types/domain";
import { formatPercent } from "@/server/services/financial-indicators";
import { formatMoney } from "@/shared/utils/labels";

export function SectorsScreen() {
  const query = useQuery({
    queryKey: ["sectores"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: SectorResumen[] }>("/api/sectores");
      return data.items;
    },
  });

  return (
    <div className="grid gap-6">
      <div>
        <DataSourceBadge />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sectores</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Conteos del padrón de demostración y promedios publicados. No es un ranking.
        </p>
      </div>
      {query.isLoading ? <LoadingBlock rows={3} /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {query.data.map((sector) => (
            <Link key={sector.codigo} href={`/sectores/${sector.slug}`} className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2">
              <Card className="h-full hover:border-primary/40">
                <CardHeader>
                  <CardTitle className="text-lg">{sector.nombre}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-1 text-sm">
                  <p>{sector.empresas} empresas</p>
                  <p>Ingresos agregados {formatMoney(sector.ingresosAgregados)}</p>
                  <p>{sector.empleados} empleados</p>
                  <p>Crecimiento promedio {formatPercent(sector.crecimientoPromedio, true)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
