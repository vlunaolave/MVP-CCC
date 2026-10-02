import type { CategoriaEvento, TipoEvento } from "@/shared/types/domain";

const CORPORATIVO = new Set<TipoEvento>(["CAMBIO_REPRESENTANTE", "NOMBRAMIENTO", "CAMBIO_PARTICIPACION"]);

export function categoriaDeEvento(tipo: TipoEvento): CategoriaEvento {
  if (tipo === "NOTICIA") {
    return "NOTICIA";
  }
  if (CORPORATIVO.has(tipo)) {
    return "CORPORATIVO";
  }
  return "REGISTRAL";
}

export const DIRECTIVE_TYPES = new Set([
  "REPRESENTANTE_LEGAL",
  "SUPLENTE",
  "MIEMBRO_JUNTA",
  "REVISOR_FISCAL",
  "OTRO_CARGO",
]);

export const OWNERSHIP_TYPES = new Set(["SOCIO"]);

export const LINK_TYPES = new Set(["ESTABLECIMIENTO", "EMPRESA_RELACIONADA", "MATRIZ", "SUBSIDIARIA"]);
