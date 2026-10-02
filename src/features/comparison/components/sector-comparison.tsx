"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/shared/lib/api-client";
import { DataSourceBadge } from "@/shared/components/data-source-badge";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { SectorComparisonPayload, SectorComparisonRow } from "@/shared/types/domain";
import { formatPercent, formatTimes } from "@/server/services/financial-indicators";
import { formatMoney } from "@/shared/utils/labels";

function show(row: SectorComparisonRow, value: number | null, signed = false): string {
  if (value === null || !Number.isFinite(value)) {
    return "N/D";
  }
  if (row.formato === "money") {
    return formatMoney(value);
  }
  if (row.formato === "percent") {
    return formatPercent(value, signed);
  }
  if (row.formato === "times") {
    return formatTimes(value);
  }
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(value);
}

export function SectorComparison({ companyId }: { companyId: string }) {
  const query = useQuery({
    queryKey: ["company", companyId, "sector"],
    queryFn: async () => {
      const { data } = await apiClient.get<SectorComparisonPayload>(`/api/empresas/${companyId}/sector`);
      return data;
    },
  });

  if (query.isLoading) {
    return <LoadingBlock rows={3} />;
  }
  if (query.isError) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }
  if (!query.data || query.data.vacio || !query.data.filas) {
    return <EmptyState title="Sin información financiera para comparar con el sector." />;
  }

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Empresa y sector · {query.data.anio}</CardTitle>
          <DataSourceBadge />
        </div>
        <p className="text-sm text-muted-foreground">Promedios de demostración del sector.</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Indicador</th>
              <th className="py-2 pr-3 font-medium">Empresa</th>
              <th className="py-2 pr-3 font-medium">Promedio del sector</th>
              <th className="py-2 pr-3 font-medium">Diferencia</th>
              <th className="py-2 font-medium">Diferencia %</th>
            </tr>
          </thead>
          <tbody>
            {query.data.filas.map((row) => (
              <tr key={row.clave} className="border-b last:border-0">
                <td className="py-2 pr-3">{row.etiqueta}</td>
                <td className="py-2 pr-3">{show(row, row.empresa)}</td>
                <td className="py-2 pr-3">{show(row, row.promedio)}</td>
                <td className="py-2 pr-3">{show(row, row.absoluta, true)}</td>
                <td className="py-2">{formatPercent(row.porcentual, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button asChild variant="link" className="mt-3 h-auto px-0">
          <Link href="/comparador">Abrir comparador</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
