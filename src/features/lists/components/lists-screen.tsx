"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient, apiErrorMessage } from "@/shared/lib/api-client";
import { useUiStore } from "@/shared/lib/ui-store";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { WatchlistItem } from "@/shared/types/domain";
import { SECTOR_LABEL } from "@/shared/utils/labels";

export function ListsScreen() {
  const user = useUiStore((state) => state.user);
  const queryClient = useQueryClient();
  const lists = useQuery({
    queryKey: ["listas", user?.id ?? "anon"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: WatchlistItem[] }>("/api/listas");
      return data.items;
    },
  });
  const remove = useMutation({
    mutationFn: async (input: { listId: string; companyId: string }) => {
      await apiClient.delete(`/api/listas/${input.listId}/empresas/${input.companyId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["listas", user?.id ?? "anon"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "No se pudo quitar la empresa.")),
  });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Listas</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Listas de organización. Poner una empresa aquí no la monitorea.
        </p>
      </div>
      {lists.isLoading ? <LoadingBlock /> : null}
      {lists.isError ? <ErrorState onRetry={() => void lists.refetch()} /> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {lists.data?.map((list) => (
          <Card key={list.id}>
            <CardHeader>
              <CardTitle className="text-base">{list.nombre}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {list.empresas.length === 0 ? <EmptyState title="Esta lista no tiene empresas." /> : null}
              {list.empresas.map((company) => (
                <div key={company.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <Link href={`/empresas/${company.id}`} className="min-w-0">
                    <p className="truncate text-sm font-medium">{company.razonSocial}</p>
                    <p className="text-xs text-muted-foreground">{company.nit} · {SECTOR_LABEL[company.sector]}</p>
                  </Link>
                  <Button type="button" variant="outline" size="sm" onClick={() => remove.mutate({ listId: list.id, companyId: company.id })}>
                    Quitar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
