"use client";

import { Accessibility, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";

type TextSize = "base" | "large" | "xlarge";

interface A11yState {
  size: TextSize;
  contrast: boolean;
  links: boolean;
}

const STORAGE_KEY = "ccc-a11y";
const DEFAULTS: A11yState = { size: "base", contrast: false, links: false };

function readState(): A11yState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "") as Partial<A11yState>;
    return {
      size: parsed.size === "large" || parsed.size === "xlarge" ? parsed.size : "base",
      contrast: Boolean(parsed.contrast),
      links: Boolean(parsed.links),
    };
  } catch {
    return DEFAULTS;
  }
}

function applyState(state: A11yState) {
  const root = document.documentElement;
  root.dataset.a11ySize = state.size;
  root.dataset.a11yContrast = state.contrast ? "true" : "false";
  root.dataset.a11yLinks = state.links ? "true" : "false";
}

export function AccessibilityWidget() {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(DEFAULTS);

  useEffect(() => {
    const stored = readState();
    setState(stored);
    applyState(stored);
  }, []);

  function update(next: A11yState) {
    setState(next);
    applyState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function stepSize(direction: 1 | -1) {
    const order: TextSize[] = ["base", "large", "xlarge"];
    const index = Math.min(order.length - 1, Math.max(0, order.indexOf(state.size) + direction));
    update({ ...state, size: order[index] ?? "base" });
  }

  return (
    <div className="fixed right-3 bottom-3 z-40 flex flex-col items-end gap-2 sm:right-5 sm:bottom-5">
      {open ? (
        <section
          id="accesibilidad-panel"
          aria-labelledby={titleId}
          className="w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border bg-white p-4 shadow-xl"
        >
          <h2 id={titleId} className="text-sm font-semibold">
            Accesibilidad
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Ajusta la lectura sin cambiar los datos.</p>
          <div className="mt-3 grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">Tamaño del texto</span>
              <div className="flex gap-1">
                <Button type="button" size="icon" variant="outline" aria-label="Reducir texto" onClick={() => stepSize(-1)}>
                  <Minus className="size-4" aria-hidden="true" />
                </Button>
                <Button type="button" size="icon" variant="outline" aria-label="Aumentar texto" onClick={() => stepSize(1)}>
                  <Plus className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
            <Button type="button" variant={state.contrast ? "default" : "outline"} onClick={() => update({ ...state, contrast: !state.contrast })}>
              {state.contrast ? "Contraste alto activo" : "Activar contraste alto"}
            </Button>
            <Button type="button" variant={state.links ? "default" : "outline"} onClick={() => update({ ...state, links: !state.links })}>
              {state.links ? "Enlaces subrayados" : "Subrayar enlaces"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => update(DEFAULTS)}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Restablecer
            </Button>
          </div>
        </section>
      ) : null}
      <Button
        type="button"
        size="icon"
        className="size-12 rounded-full shadow-lg"
        aria-expanded={open}
        aria-controls="accesibilidad-panel"
        aria-label={open ? "Cerrar opciones de accesibilidad" : "Abrir opciones de accesibilidad"}
        onClick={() => setOpen((value) => !value)}
      >
        <Accessibility className="size-5" aria-hidden="true" />
      </Button>
    </div>
  );
}
