"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/shared/components/screen-states";
import type { TimelineItem, TipoEvento } from "@/shared/types/domain";
import { formatDisplayDate } from "@/shared/utils/dates";
import { EVENTO_LABEL } from "@/shared/utils/labels";

const ALL = "todos";

export function CompanyTimeline({ events }: { events: TimelineItem[] }) {
  const [tipo, setTipo] = useState<string>(ALL);
  const options = [...new Set(events.map((event) => event.tipo))];
  const visible = tipo === ALL ? events : events.filter((event) => event.tipo === tipo);

  return (
    <div className="grid gap-4">
      <div className="max-w-xs">
        <Label>Tipo de evento</Label>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="mt-1.5 w-full" data-testid="timeline-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {EVENTO_LABEL[option as TipoEvento]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {visible.length === 0 ? <EmptyState title="No hay eventos de este tipo." /> : null}
      <ol className="relative grid gap-0 border-l border-primary/30 pl-6">
        {visible.map((event) => (
          <li key={event.id} className="relative pb-6">
            <span className="absolute top-1.5 -left-[1.65rem] size-3 rounded-full border-2 border-primary bg-card" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">{formatDisplayDate(event.fecha)}</p>
            <p className="font-medium">{event.titulo}</p>
            <p className="text-sm text-muted-foreground">{EVENTO_LABEL[event.tipo]} · {event.fuente === "ESAL" ? "ESAL" : "Registro Mercantil"}</p>
            <p className="mt-1 text-sm leading-6">{event.descripcion}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
