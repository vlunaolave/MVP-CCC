import type { Cobertura } from "@/shared/types/domain";
import { formatDisplayDate } from "@/shared/utils/dates";

const FACTS: { key: keyof Cobertura; label: string }[] = [
  { key: "registral", label: "Registral" },
  { key: "financiera", label: "Financiera" },
  { key: "directivos", label: "Directivos" },
  { key: "propiedad", label: "Propiedad" },
  { key: "relaciones", label: "Relaciones" },
  { key: "ultimaActualizacion", label: "Última actualización" },
];

export function CoverageList({ cobertura }: { cobertura: Cobertura }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {FACTS.map((fact) => (
        <li key={fact.key} className="rounded-lg border px-3 py-2">
          <p className="text-xs text-muted-foreground">{fact.label}</p>
          <p className="text-sm font-medium">
            {fact.key === "ultimaActualizacion" ? formatDisplayDate(cobertura.ultimaActualizacion) : cobertura[fact.key]}
          </p>
        </li>
      ))}
    </ul>
  );
}
