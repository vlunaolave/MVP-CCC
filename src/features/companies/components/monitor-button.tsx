"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUiStore } from "@/shared/lib/ui-store";
import { apiClient, apiErrorMessage } from "@/shared/lib/api-client";

export function MonitorButton({
  companyId,
  monitoreada,
  testId = "company-monitor",
}: {
  companyId: string;
  monitoreada: boolean;
  testId?: string;
}) {
  const user = useUiStore((state) => state.user);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const canMonitor = user?.permisos.includes("empresas.monitorear") ?? false;

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["companies"] });
    await queryClient.invalidateQueries({ queryKey: ["company", companyId] });
    await queryClient.invalidateQueries({ queryKey: ["monitoring"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      await apiClient.post("/api/monitoreo", { companyId });
    },
    onSuccess: async () => {
      toast.success("Empresa agregada al monitoreo correctamente.");
      await invalidate();
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "No se pudo agregar la empresa."));
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/monitoreo/${companyId}`);
    },
    onSuccess: async () => {
      toast.success("Empresa retirada del monitoreo.");
      setOpen(false);
      await invalidate();
    },
    onError: (error: unknown) => {
      toast.error(apiErrorMessage(error, "No se pudo retirar la empresa."));
    },
  });

  if (!canMonitor) {
    return null;
  }

  if (!monitoreada) {
    return (
      <Button type="button" className="h-9" data-testid={testId} disabled={add.isPending} onClick={() => add.mutate()}>
        {add.isPending ? "Agregando…" : "Monitorear"}
      </Button>
    );
  }

  return (
    <>
      <Button type="button" variant="outline" className="h-9" data-testid={testId} onClick={() => setOpen(true)}>
        Dejar de monitorear
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quitar del monitoreo</DialogTitle>
            <DialogDescription>La empresa dejará de aparecer en tu seguimiento. Las alertas históricas se conservan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={remove.isPending} onClick={() => remove.mutate()}>
              Quitar del monitoreo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
