"use client";

import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "cn";

export interface FilterChip {
  id: string;
  label: string;
}

export function FilterBar({
  count,
  chips,
  onRemove,
  onClear,
  onApply,
  dirty = false,
  mode = "sheet",
  children,
}: {
  count: number;
  chips: FilterChip[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onApply: () => void;
  dirty?: boolean;
  mode?: "sheet" | "popover";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  function apply() {
    onApply();
    setOpen(false);
  }

  function clear() {
    onClear();
    setOpen(false);
  }

  const trigger = (
    <Button type="button" variant="outline" className="h-10 gap-2 rounded-xl bg-white" aria-expanded={open}>
      <SlidersHorizontal className="size-4" aria-hidden="true" />
      {count > 0 ? `Filtros ${count}` : "Filtros"}
    </Button>
  );

  const actions = (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={apply}>
        Aplicar filtros
      </Button>
      <Button type="button" variant="outline" onClick={clear}>
        Limpiar filtros
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        Cerrar
      </Button>
    </div>
  );

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {mode === "popover" ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-semibold">Filtros</p>
                <p className="text-xs text-muted-foreground">
                  {dirty ? "Hay cambios sin aplicar." : "Elige los criterios y aplícalos."}
                </p>
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-4">{children}</div>
              <div className="border-t p-3">{actions}</div>
            </PopoverContent>
          </Popover>
        ) : (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>{trigger}</SheetTrigger>
            <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
              <SheetHeader className="border-b pr-12">
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>
                  {dirty ? "Hay cambios sin aplicar." : "Organiza la consulta y aplícala cuando esté lista."}
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4">{children}</div>
              <SheetFooter className="border-t">{actions}</SheetFooter>
            </SheetContent>
          </Sheet>
        )}
        {count > 0 ? (
          <Button type="button" variant="ghost" className="h-10" onClick={onClear}>
            Limpiar
          </Button>
        ) : null}
      </div>
      {chips.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Filtros aplicados">
          {chips.map((chip) => (
            <li key={chip.id}>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() => onRemove(chip.id)}
                aria-label={`Quitar filtro ${chip.label}`}
              >
                {chip.label}
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function FilterGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-border/80 py-3 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 py-1 text-left text-sm font-semibold"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {title}
        <ChevronDown className={cn("size-4 text-muted-foreground transition", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open ? <div className="mt-3 grid gap-3">{children}</div> : null}
    </section>
  );
}

export function FilterField({
  label,
  pending = false,
  children,
}: {
  label: string;
  pending?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        {pending ? <span className="text-[10px] font-semibold tracking-wide text-primary uppercase">Sin aplicar</span> : null}
      </div>
      <div className={cn("rounded-lg", pending && "ring-2 ring-primary/35")}>{children}</div>
    </div>
  );
}
