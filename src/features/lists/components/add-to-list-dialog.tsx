"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiClient, apiErrorMessage } from "@/shared/lib/api-client";
import { useUiStore } from "@/shared/lib/ui-store";
import type { WatchlistItem } from "@/shared/types/domain";

export function AddToListDialog({ companyId }: { companyId: string }) {
  const user = useUiStore((state) => state.user);
  const canManage = user?.permisos.includes("listas.gestionar") ?? false;
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const lists = useQuery({
    queryKey: ["listas", user?.id ?? "anon"],
    enabled: canManage && open,
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: WatchlistItem[] }>("/api/listas");
      return data.items;
    },
  });
  const toggle = useMutation({
    mutationFn: async (list: WatchlistItem) => {
      const included = list.empresas.some((company) => company.id === companyId);
      if (included) {
        await apiClient.delete(`/api/listas/${list.id}/empresas/${companyId}`);
        return;
      }
      await apiClient.post(`/api/listas/${list.id}/empresas`, { companyId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["listas", user?.id ?? "anon"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "No se pudo actualizar la lista.")),
  });

  if (!canManage) {
    return null;
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Agregar a lista
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar a lista</DialogTitle>
            <DialogDescription>Una empresa puede estar en varias listas. Esto no cambia el monitoreo.</DialogDescription>
          </DialogHeader>
          <ul className="grid gap-2">
            {lists.data?.map((list) => {
              const included = list.empresas.some((company) => company.id === companyId);
              return (
                <li key={list.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                  <span className="text-sm">{list.nombre}</span>
                  <Button type="button" size="sm" variant={included ? "secondary" : "outline"} onClick={() => toggle.mutate(list)}>
                    {included ? "Quitar" : "Agregar"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
