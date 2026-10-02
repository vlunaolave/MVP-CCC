"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/shared/components/screen-states";
import type { CategoriaTimeline, TimelineItem } from "@/shared/types/domain";
import { formatDisplayDate } from "@/shared/utils/dates";
import { CATEGORIA_LABEL, EVENTO_LABEL } from "@/shared/utils/labels";

const FILTERS: { id: "todos" | CategoriaTimeline; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "REGISTRAL", label: "Registrales" },
  { id: "CORPORATIVO", label: "Corporativos" },
  { id: "FINANCIERO", label: "Financieros" },
  { id: "ALERTA", label: "Alertas" },
  { id: "NOTICIA", label: "Noticias" },
];

function fuenteLabel(fuente: string) {
  if (fuente === "ESAL") return "ESAL";
  if (fuente === "DEMO" || fuente === "Datos de demostración") return "Datos de demostración";
  return "Registro Mercantil";
}

export function CompanyTimeline({ events }: { events: TimelineItem[] }) {
  const [categoria, setCategoria] = useState<(typeof FILTERS)[number]["id"]>("todos");
  const visible = categoria === "todos" ? events : events.filter((event) => event.categoria === categoria);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar línea de tiempo">
        {FILTERS.map((filter) => (
          <Button
            key={filter.id}
            type="button"
            size="sm"
            variant={categoria === filter.id ? "default" : "outline"}
            aria-pressed={categoria === filter.id}
            onClick={() => setCategoria(filter.id)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
      {visible.length === 0 ? <EmptyState title="No hay eventos de esta categoría." /> : null}
      <ol className="relative grid gap-0 border-l border-primary/30 pl-6">
        {visible.map((event) => (
          <li key={event.id} className="relative pb-6">
            <span className="absolute top-1.5 -left-[1.65rem] size-3 rounded-full border-2 border-primary bg-card" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">{formatDisplayDate(event.fecha)}</p>
            <p className="font-medium">{event.titulo}</p>
            <p className="text-sm text-muted-foreground">
              {CATEGORIA_LABEL[event.categoria]}
              {event.tipo ? ` · ${EVENTO_LABEL[event.tipo]}` : ""} · {fuenteLabel(event.fuente)}
            </p>
            <p className="mt-1 text-sm leading-6">{event.descripcion}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
