import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Acceso denegado" };

export default function DeniedPage() {
  return (
    <main id="contenido" className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-sm font-medium text-primary">Inteligencia empresarial</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">No tienes permiso para ver esta sección.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Tu rol no incluye esta consulta. Vuelve al inicio para continuar con las empresas y el tablero que sí puedes abrir.
      </p>
      <Button asChild className="mt-6 w-fit">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
