import type { RelationItem, VinculoPersona } from "@/shared/types/domain";
import { RELACION_LABEL } from "@/shared/utils/labels";

const TIPO_ORDEN: Record<VinculoPersona["tipo"], number> = {
  REPRESENTANTE_LEGAL: 0,
  SOCIO: 1,
};

export function sortVinculos(vinculos: VinculoPersona[]): VinculoPersona[] {
  return [...vinculos].sort(
    (a, b) =>
      a.razonSocial.localeCompare(b.razonSocial, "es") ||
      TIPO_ORDEN[a.tipo] - TIPO_ORDEN[b.tipo] ||
      a.fechaInicio.localeCompare(b.fechaInicio),
  );
}

export function attachVinculosByPerson(
  relations: RelationItem[],
  rolesByPerson: Map<string, VinculoPersona[]>,
): RelationItem[] {
  return relations.map((relation) => {
    if (!relation.persona) {
      return relation;
    }
    return {
      ...relation,
      persona: {
        ...relation.persona,
        vinculos: sortVinculos(rolesByPerson.get(relation.persona.id) ?? []),
      },
    };
  });
}

export function personScopeLabel(vinculos: VinculoPersona[]): string | null {
  const socios = new Set(vinculos.filter((item) => item.tipo === "SOCIO").map((item) => item.companyId));
  const representantes = new Set(
    vinculos.filter((item) => item.tipo === "REPRESENTANTE_LEGAL").map((item) => item.companyId),
  );
  const empresas = new Set(vinculos.map((item) => item.companyId));
  const roles = (socios.size > 0 ? 1 : 0) + (representantes.size > 0 ? 1 : 0);
  if (empresas.size < 2 && roles < 2) {
    return null;
  }
  const parts: string[] = [];
  if (socios.size > 0) {
    parts.push(socios.size === 1 ? "Socio en 1 empresa" : `Socio en ${socios.size} empresas`);
  }
  if (representantes.size > 0) {
    parts.push(
      representantes.size === 1
        ? "Representante legal en 1 empresa"
        : `Representante legal en ${representantes.size} empresas`,
    );
  }
  return parts.join(" · ");
}

export function vinculoLabel(vinculo: VinculoPersona): string {
  const parts = [RELACION_LABEL[vinculo.tipo]];
  if (vinculo.porcentajeParticipacion !== null) {
    parts.push(`${vinculo.porcentajeParticipacion} %`);
  }
  parts.push(vinculo.vigente ? "Vigente" : "No vigente");
  return parts.join(" · ");
}

export interface PersonRelationGroup {
  persona: NonNullable<RelationItem["persona"]>;
  relaciones: RelationItem[];
}

export function groupRelationsByPerson(relations: RelationItem[]): {
  personas: PersonRelationGroup[];
  otras: RelationItem[];
} {
  const groups = new Map<string, PersonRelationGroup>();
  const otras: RelationItem[] = [];
  for (const relation of relations) {
    if (!relation.persona) {
      otras.push(relation);
      continue;
    }
    const current = groups.get(relation.persona.id) ?? { persona: relation.persona, relaciones: [] };
    current.persona = relation.persona;
    current.relaciones.push(relation);
    groups.set(relation.persona.id, current);
  }
  const personas = [...groups.values()].sort((a, b) => {
    const scopeA = personScopeLabel(a.persona.vinculos) ? 1 : 0;
    const scopeB = personScopeLabel(b.persona.vinculos) ? 1 : 0;
    if (scopeA !== scopeB) {
      return scopeB - scopeA;
    }
    return a.persona.nombre.localeCompare(b.persona.nombre, "es");
  });
  return { personas, otras };
}

export function vinculosEnOtrasEmpresas(vinculos: VinculoPersona[], companyId: string): VinculoPersona[] {
  return sortVinculos(vinculos.filter((item) => item.companyId !== companyId));
}
