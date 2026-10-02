"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useComparisonStore } from "@/features/comparison/store";

export function CompareButton({ companyId, size = "default" }: { companyId: string; size?: "default" | "sm" }) {
  const ids = useComparisonStore((state) => state.ids);
  const add = useComparisonStore((state) => state.add);
  const included = ids.includes(companyId);

  return (
    <Button
      type="button"
      size={size}
      variant={included ? "secondary" : "outline"}
      onClick={() => {
        const result = add(companyId);
        if (result === "added") {
          toast("Agregada al comparador");
        }
        if (result === "full") {
          toast("El comparador admite máximo 4 empresas");
        }
      }}
    >
      {included ? "Quitar del comparador" : "Comparar"}
    </Button>
  );
}
