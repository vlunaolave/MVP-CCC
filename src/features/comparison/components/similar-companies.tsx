"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CompareButton } from "@/features/comparison/components/compare-button";
import { apiClient } from "@/shared/lib/api-client";
import { ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { SimilarItem } from "@/shared/types/domain";
import { SECTOR_LABEL, TAMANO_LABEL, formatMoney } from "@/shared/utils/labels";

export function SimilarCompanies({ companyId }: { companyId: string }) {
  const query = useQuery({
    queryKey: ["company", companyId, "similares"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: SimilarItem[] }>(`/api/empresas/${companyId}/similares`);
      return data.items;
    },
  });

  if (query.isLoading) {
    return <LoadingBlock rows={2} />;
  }
  if (query.isError) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }
  if (!query.data || query.data.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay otras empresas del mismo sector en el padrón.</p>;
  }

  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {query.data.map((item) => (
        <li key={item.id} className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="font-medium">{item.razonSocial}</p>
          <p className="text-sm text-muted-foreground">
            {item.nit} · {SECTOR_LABEL[item.sector]} · {item.ciudad} · {TAMANO_LABEL[item.tamanoEmpresa]}
          </p>
          <p className="mt-1 text-sm">Ingresos {formatMoney(item.ingresos)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/empresas/${item.id}`}>Ver perfil</Link>
            </Button>
            <CompareButton companyId={item.id} size="sm" />
          </div>
        </li>
      ))}
    </ul>
  );
}
