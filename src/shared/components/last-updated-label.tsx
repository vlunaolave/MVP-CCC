import { formatDisplayDate } from "@/shared/utils/dates";

export function LastUpdatedLabel({ value }: { value: string | null | undefined }) {
  return (
    <p className="text-sm text-muted-foreground">
      {value ? `Actualizada el ${formatDisplayDate(value)}` : "Sin fecha de actualización"}
    </p>
  );
}
