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
      <Button type="submit" className="h-10" disabled={mutation.isPending} data-testid="login-submit">
        {mutation.isPending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
