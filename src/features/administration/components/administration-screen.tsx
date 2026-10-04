"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createUserFormSchema,
  editUserFormSchema,
  type CreateUserFormValues,
  type EditUserFormValues,
} from "@/features/administration/schemas";
import { apiClient, apiErrorMessage } from "@/shared/lib/api-client";
import { EmptyState, ErrorState, LoadingBlock } from "@/shared/components/screen-states";
import type { AdminRole, AdminUser, AppSettingItem, RolCodigo } from "@/shared/types/domain";
import { ROL_LABEL } from "@/shared/utils/labels";

export function AdministrationScreen() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Usuarios, consulta de roles, parámetros y reglas de alerta.</p>
      </div>
      <Button type="button" variant="outline" className="w-fit" asChild>
        <Link href="/administracion/reglas-alerta">Reglas de alerta</Link>
      </Button>
      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="configuracion">Configuración</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="roles">
          <RolesPanel />
        </TabsContent>
        <TabsContent value="configuracion">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersPanel() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const query = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: AdminUser[] }>("/api/admin/usuarios");
      return data.items;
    },
  });
  const create = useMutation({
    mutationFn: async (values: CreateUserFormValues) => {
      await apiClient.post("/api/admin/usuarios", values);
    },
    onSuccess: async () => {
      toast.success("Usuario creado.");
      setCreating(false);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "No se pudo crear el usuario.")),
  });
  const update = useMutation({
    mutationFn: async (values: EditUserFormValues & { id: string }) => {
      await apiClient.patch(`/api/admin/usuarios/${values.id}`, {
        nombre: values.nombre,
        rol: values.rol,
        activo: values.activo,
        password: values.password || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Usuario actualizado.");
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "No se pudo actualizar el usuario.")),
  });

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setCreating(true)}>
          Crear usuario
        </Button>
      </div>
      {query.isLoading ? <LoadingBlock /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.length === 0 ? <EmptyState title="No hay usuarios." /> : null}
      {query.data && query.data.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.nombre}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{ROL_LABEL[user.rol]}</TableCell>
                  <TableCell>{user.activo ? "Activo" : "Inactivo"}</TableCell>
                  <TableCell>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditing(user)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      <CreateUserDialog
        open={creating}
        pending={create.isPending}
        onOpenChange={setCreating}
        onSubmit={(values) => create.mutate(values)}
      />
      <EditUserDialog
        user={editing}
        pending={update.isPending}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={(values) => editing && update.mutate({ ...values, id: editing.id })}
      />
    </div>
  );
}

function CreateUserDialog({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateUserFormValues) => void;
}) {
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: { nombre: "", email: "", password: "", rol: "CONSULTOR" },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>La cuenta queda activa y puede entrar con el correo y la contraseña que definas.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={form.handleSubmit((values) => {
            onSubmit(values);
            form.reset();
          })}
        >
          <Field label="Nombre" error={form.formState.errors.nombre?.message}>
            <Input {...form.register("nombre")} />
          </Field>
          <Field label="Correo" error={form.formState.errors.email?.message}>
            <Input type="email" {...form.register("email")} />
          </Field>
          <Field label="Contraseña" error={form.formState.errors.password?.message}>
            <Input type="password" {...form.register("password")} />
          </Field>
          <RoleField value={form.watch("rol")} onChange={(rol) => form.setValue("rol", rol)} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  pending,
  onOpenChange,
  onSubmit,
}: {
  user: AdminUser | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EditUserFormValues) => void;
}) {
  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    values: user
      ? { nombre: user.nombre, rol: user.rol, activo: user.activo, password: "" }
      : { nombre: "", rol: "CONSULTOR", activo: true, password: "" },
  });
  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>Puedes cambiar el nombre, el rol, la contraseña o el estado de la cuenta.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label="Nombre" error={form.formState.errors.nombre?.message}>
            <Input {...form.register("nombre")} />
          </Field>
          <RoleField value={form.watch("rol")} onChange={(rol) => form.setValue("rol", rol)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.watch("activo")} onChange={(event) => form.setValue("activo", event.target.checked)} />
            Cuenta activa
          </label>
          <Field label="Nueva contraseña" error={form.formState.errors.password?.message}>
            <Input type="password" placeholder="Opcional" {...form.register("password")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onSubmit({ ...form.getValues(), activo: !form.getValues("activo") })}>
              {form.watch("activo") ? "Desactivar" : "Activar"}
            </Button>
            <Button type="submit" disabled={pending}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RolesPanel() {
  const query = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: AdminRole[] }>("/api/admin/roles");
      return data.items;
    },
  });
  if (query.isLoading) {
    return <LoadingBlock />;
  }
  if (query.isError) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Los permisos se consultan. En este MVP no se editan.</p>
      <div className="grid gap-4 lg:grid-cols-3">
        {query.data?.map((role) => (
          <Card key={role.codigo}>
            <CardHeader>
              <CardTitle>{role.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">{role.descripcion}</p>
              <ul className="grid gap-1 text-sm">
                {role.permisos.map((permission) => (
                  <li key={permission.codigo}>{permission.descripcion}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: AppSettingItem[] }>("/api/admin/configuracion");
      return data.items;
    },
  });
  const mutation = useMutation({
    mutationFn: async (input: { clave: string; valor: string }) => {
      await apiClient.patch("/api/admin/configuracion", input);
    },
    onSuccess: async () => {
      toast.success("Configuración guardada.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (error: unknown) => toast.error(apiErrorMessage(error, "No se pudo guardar.")),
  });
  if (query.isLoading) {
    return <LoadingBlock />;
  }
  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }
  return (
    <div className="grid gap-4">
      {query.data.map((setting) => (
        <SettingRow key={setting.clave} setting={setting} pending={mutation.isPending} onSave={(valor) => mutation.mutate({ clave: setting.clave, valor })} />
      ))}
    </div>
  );
}

function SettingRow({
  setting,
  pending,
  onSave,
}: {
  setting: AppSettingItem;
  pending: boolean;
  onSave: (valor: string) => void;
}) {
  const [valor, setValor] = useState(setting.valor);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{setting.descripcion}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Label htmlFor={setting.clave}>{setting.clave}</Label>
        <Input id={setting.clave} value={valor} onChange={(event) => setValor(event.target.value)} />
        <Button type="button" className="w-fit" disabled={pending || valor.trim().length === 0} onClick={() => onSave(valor.trim())}>
          Guardar
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function RoleField({ value, onChange }: { value: RolCodigo; onChange: (rol: RolCodigo) => void }) {
  return (
    <div className="grid gap-1.5">
      <Label>Rol</Label>
      <Select value={value} onValueChange={(next) => onChange(next as RolCodigo)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
          <SelectItem value="ANALISTA">Analista</SelectItem>
          <SelectItem value="CONSULTOR">Consultor</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
