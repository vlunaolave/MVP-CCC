"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginFormSchema, type LoginFormValues } from "@/features/auth/schemas";
import { apiClient, apiErrorMessage } from "@/shared/lib/api-client";

const DEMO_PASSWORD = "CccDemo.2026";

const DEMOS = [
  { email: "admin@demo.ccc", rol: "Administrador" },
  { email: "analista@demo.ccc", rol: "Analista" },
  { email: "consultor@demo.ccc", rol: "Consultor" },
];

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });
  const mutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      await apiClient.post("/api/auth/login", values);
    },
    onSuccess: () => {
      window.location.assign("/");
    },
    onError: (error: unknown) => {
      setServerError(apiErrorMessage(error, "Correo o contraseña incorrectos."));
    },
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) => {
        setServerError(null);
        mutation.mutate(values);
      })}
      noValidate
    >
      <div className="grid gap-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" type="email" autoComplete="username" aria-invalid={Boolean(form.formState.errors.email)} {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>
      {serverError ? (
        <p className="text-sm text-destructive" role="alert" data-testid="login-error">
          {serverError}
        </p>
      ) : null}
      <Button type="submit" className="h-11 rounded-xl" disabled={mutation.isPending} data-testid="login-submit">
        {mutation.isPending ? "Ingresando…" : "Ingresar"}
      </Button>
      <div className="grid gap-2 pt-2">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Cuentas de demostración</p>
        {DEMOS.map((account) => (
          <button
            key={account.email}
            type="button"
            className="flex items-center justify-between gap-3 rounded-xl border bg-slate-50 px-3 py-2 text-left transition hover:border-primary/30 hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => {
              form.setValue("email", account.email, { shouldValidate: true });
              form.setValue("password", DEMO_PASSWORD, { shouldValidate: true });
            }}
          >
            <span>
              <span className="block text-sm font-medium">{account.rol}</span>
              <span className="text-xs text-muted-foreground">{account.email}</span>
            </span>
            <span className="text-xs font-medium text-primary">Usar</span>
          </button>
        ))}
        <p className="text-xs text-muted-foreground">Contraseña de demostración: {DEMO_PASSWORD}</p>
      </div>
    </form>
  );
}
