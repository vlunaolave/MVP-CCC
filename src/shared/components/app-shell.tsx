"use client";

import {
  Bell,
  Building2,
  Eye,
  GitCompare,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useComparisonStore } from "@/features/comparison";
import { apiClient } from "@/shared/lib/api-client";
import { useUiStore } from "@/shared/lib/ui-store";
import type { PermissionCode, SessionUser } from "@/shared/types/domain";
import { ROL_LABEL } from "@/shared/utils/labels";
import { cn } from "cn";

const NAV: { href: string; label: string; icon: typeof Building2; permission: PermissionCode }[] = [
  { href: "/", label: "Inicio", icon: Shield, permission: "inicio.ver" },
  { href: "/empresas", label: "Empresas", icon: Building2, permission: "empresas.consultar" },
  { href: "/sectores", label: "Sectores", icon: Layers, permission: "sectores.ver" },
  { href: "/comparador", label: "Comparador", icon: GitCompare, permission: "empresas.consultar" },
  { href: "/monitoreo", label: "Monitoreo", icon: Eye, permission: "monitoreo.ver" },
  { href: "/listas", label: "Listas", icon: ListChecks, permission: "listas.ver" },
  { href: "/alertas", label: "Alertas", icon: Bell, permission: "alertas.ver" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.ver" },
  { href: "/administracion", label: "Administración", icon: Settings, permission: "admin.usuarios" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const setUser = useUiStore((state) => state.setUser);
  const stored = useUiStore((state) => state.user);
  if (stored?.id !== user.id || stored.rol !== user.rol || stored.aviso !== user.aviso) {
    setUser(user);
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
          <Brand />
          <Nav />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <Header user={user} />
          <div className="border-b bg-amber-50 px-4 py-2 text-sm text-amber-950 md:px-6">{user.aviso}</div>
          <main id="contenido" className="flex-1 px-4 py-6 md:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="border-b px-5 py-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Cámara de Comercio de Cali</p>
      <p className="mt-1 text-sm font-semibold text-foreground">Inteligencia empresarial</p>
    </div>
  );
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useUiStore((state) => state.user);
  const compared = useComparisonStore((state) => state.ids.length);
  const items = NAV.filter((item) => user?.permisos.includes(item.permission));
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Principal">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent",
              active && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {item.href === "/comparador" && compared > 0 ? (
              <span className="rounded-full bg-primary/15 px-1.5 text-xs">{compared}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function Header({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const canSeeAlerts = user.permisos.includes("alertas.ver");
  const badge = useQuery({
    queryKey: ["alerts", "badge"],
    enabled: canSeeAlerts,
    queryFn: async () => {
      const { data } = await apiClient.get<{ noLeidas: number }>("/api/alertas", { params: { leida: "false" } });
      return data.noLeidas;
    },
  });

  async function logout() {
    await apiClient.post("/api/auth/logout");
    useUiStore.getState().setUser(null);
    window.location.assign("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur md:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menú"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-4" aria-hidden="true" />
        </Button>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menú</SheetTitle>
            <SheetDescription>Navegación principal</SheetDescription>
          </SheetHeader>
          <Brand />
          <Nav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <form
        className="relative min-w-0 flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          const value = query.trim();
          router.push(value ? `/empresas?q=${encodeURIComponent(value)}` : "/empresas");
        }}
      >
        <label htmlFor="header-search" className="sr-only">
          Busca una empresa por NIT o razón social
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id="header-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Busca una empresa por NIT o razón social"
          className="h-10 pl-9"
        />
      </form>
      {canSeeAlerts ? (
        <Button type="button" variant="outline" size="icon" className="relative" aria-label="Alertas no leídas" asChild>
          <Link href="/alertas">
            <Bell className="size-4" aria-hidden="true" />
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {badge.data ?? 0}
            </span>
          </Link>
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="h-10 max-w-48" data-testid="user-menu">
            <span className="truncate">{user.nombre}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <span className="block">{user.nombre}</span>
            <span className="block text-xs font-normal text-muted-foreground">{ROL_LABEL[user.rol]}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void logout()}>
            <LogOut className="size-4" aria-hidden="true" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
