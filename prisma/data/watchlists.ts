import type { WatchlistSeed } from "./types";

const organization = [
  { tipo: "CLIENTES_ESTRATEGICOS" as const, nombre: "Clientes estratégicos" },
  { tipo: "PROSPECTOS" as const, nombre: "Prospectos" },
  { tipo: "PROVEEDORES" as const, nombre: "Proveedores" },
  { tipo: "TECNOLOGIA" as const, nombre: "Empresas de tecnología" },
];

function listsFor(email: string, prefix: string, items: Record<string, string[]>): WatchlistSeed[] {
  return organization.map((list) => ({
    id: `wl-${prefix}-${list.tipo.toLowerCase()}`,
    userEmail: email,
    nombre: list.nombre,
    tipo: list.tipo,
    companyIds: items[list.tipo] ?? [],
  }));
}

export const watchlists: WatchlistSeed[] = [
  ...listsFor("analista@demo.ccc", "analista", {
    CLIENTES_ESTRATEGICOS: ["co-innova"],
    PROSPECTOS: ["co-horizonte"],
    PROVEEDORES: ["co-nube"],
    TECNOLOGIA: ["co-innova"],
  }),
  ...listsFor("admin@demo.ccc", "admin", {}),
];
