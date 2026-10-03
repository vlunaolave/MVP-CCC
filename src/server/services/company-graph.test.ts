import { describe, expect, it } from "vitest";

import { companies } from "../../../prisma/data/companies";
import { people } from "../../../prisma/data/people";
import { relations } from "../../../prisma/data/relations";
import { buildCompanyGraph } from "@/server/services/company-graph";
import type { GraphNode, RelationItem, VinculoPersona } from "@/shared/types/domain";
import { attachVinculosByPerson, personScopeLabel } from "@/shared/utils/person-relations";

function companyName(id: string): { razonSocial: string; nit: string } {
  const company = companies.find((item) => item.id === id);
  if (!company) {
    throw new Error(id);
  }
  return company;
}

function rolesOf(personId: string): VinculoPersona[] {
  return relations.flatMap((relation) => {
    if (relation.personId !== personId || (relation.tipo !== "SOCIO" && relation.tipo !== "REPRESENTANTE_LEGAL")) {
      return [];
    }
    const company = companyName(relation.companyId);
    return [
      {
        relacionId: relation.id,
        companyId: relation.companyId,
        razonSocial: company.razonSocial,
        nit: company.nit,
        tipo: relation.tipo,
        porcentajeParticipacion: relation.porcentajeParticipacion ?? null,
        vigente: relation.vigente,
        fechaInicio: relation.fechaInicio,
        fechaFin: relation.fechaFin ?? null,
      },
    ];
  });
}

function relationItem(id: string): RelationItem {
  const relation = relations.find((item) => item.id === id);
  if (!relation) {
    throw new Error(id);
  }
  const person = people.find((item) => item.id === relation.personId);
  const related = relation.relatedCompanyId ? companyName(relation.relatedCompanyId) : null;
  return {
    id: relation.id,
    tipo: relation.tipo,
    descripcion: relation.descripcion,
    porcentajeParticipacion: relation.porcentajeParticipacion ?? null,
    fechaInicio: relation.fechaInicio,
    fechaFin: relation.fechaFin ?? null,
    vigente: relation.vigente,
    persona: person
      ? {
          id: person.id,
          nombre: person.nombre,
          tipoDocumento: person.tipoDocumento,
          numeroDocumento: person.numeroDocumento,
          vinculos: [],
        }
      : null,
    empresaRelacionada: related
      ? { id: relation.relatedCompanyId ?? "", razonSocial: related.razonSocial, nit: related.nit }
      : null,
    establecimiento: null,
  };
}

function innovaGraph() {
  const local = relations.filter((item) => item.companyId === "co-innova").map((item) => relationItem(item.id));
  const roles = new Map<string, VinculoPersona[]>();
  for (const relation of local) {
    if (relation.persona) {
      roles.set(relation.persona.id, rolesOf(relation.persona.id));
    }
  }
  const withRoles = attachVinculosByPerson(local, roles);
  const company: GraphNode = {
    id: "empresa-co-innova",
    type: "empresa",
    data: { titulo: "INNOVA VALLE S.A.S.", subtitulo: "Empresa", campos: [] },
  };
  return buildCompanyGraph({ companyId: "co-innova", company, relations: withRoles });
}

describe("relaciones por persona", () => {
  it("identifica al socio de varias empresas y al representante que también es socio", () => {
    const graph = innovaGraph();
    const andres = graph.nodes.find((node) => node.id === "persona-per-andres");
    const mariana = graph.nodes.find((node) => node.id === "persona-per-mariana");
    expect(andres?.data.nota).toBe("Socio en 2 empresas · Representante legal en 1 empresa");
    expect(mariana?.data.nota).toBe("Socio en 2 empresas · Representante legal en 1 empresa");
    expect(graph.nodes.filter((node) => node.id === "persona-per-mariana")).toHaveLength(1);
    expect(graph.edges.find((edge) => edge.id === "edge-persona-per-mariana")?.label).toBe(
      "Representante legal · Socio",
    );
    expect(graph.edges.find((edge) => edge.id === "edge-persona-per-andres-co-nube")?.label).toContain("Socio");
    expect(graph.edges.find((edge) => edge.id === "edge-persona-per-andres-co-agro")?.label).toContain(
      "Representante legal",
    );
    expect(graph.edges.find((edge) => edge.id === "edge-persona-per-mariana-co-agro")?.label).toContain("Socio");
    expect(graph.nodes.filter((node) => node.id === "vinculo-empresa-co-nube")).toHaveLength(1);
    expect(andres?.data.campos.map((campo) => campo.etiqueta)).toEqual(
      expect.arrayContaining(["Alcance", "Nube del Pacífico S.A.S.", "AgroSiembra del Cauca S.A.S."]),
    );
  });

  it("reúne en una sola persona los dos cargos de representante legal", () => {
    expect(personScopeLabel(rolesOf("per-lucia"))).toBe("Representante legal en 2 empresas");
  });
});
