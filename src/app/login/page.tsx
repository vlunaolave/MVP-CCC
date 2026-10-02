import type { Metadata } from "next";

import { LoginForm } from "@/features/auth";

export const metadata: Metadata = { title: "Entrar · Inteligencia empresarial" };

export default function LoginPage() {
  return (
    <main id="contenido" className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary px-12 py-14 text-primary-foreground lg:flex">
        <div>
          <p className="text-sm font-medium tracking-wide uppercase opacity-80">Cámara de Comercio de Cali</p>
          <h1 className="mt-6 max-w-md text-4xl font-semibold tracking-tight">Inteligencia empresarial para decidir con el registro a la mano.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-primary-foreground/80">
            Consulta mercantil y ESAL, seguimiento, alertas y tablero en un solo lugar. Los datos de esta demostración son simulados.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/75">Registro Mercantil y ESAL · datos ficticios</p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="text-sm font-medium text-primary lg:hidden">Cámara de Comercio de Cali</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Entrar</h2>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">Usa una cuenta de demostración. La contraseña está en el README.</p>
          <LoginForm />
          <ul className="mt-6 grid gap-1 text-sm text-muted-foreground">
            <li>admin@demo.ccc · Administrador</li>
            <li>analista@demo.ccc · Analista</li>
            <li>consultor@demo.ccc · Consultor</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
