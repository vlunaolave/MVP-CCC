import type { RelationSeed } from "../../../prisma/data/types";

const PERSON_RELATIONS = new Set([
  "REPRESENTANTE_LEGAL",
  "SOCIO",
  "SUPLENTE",
  "MIEMBRO_JUNTA",
  "REVISOR_FISCAL",
  "OTRO_CARGO",
]);

const COMPANY_RELATIONS = new Set(["EMPRESA_RELACIONADA", "MATRIZ", "SUBSIDIARIA"]);

export function assertRelationIntegrity(relations: RelationSeed[]): void {
  for (const relation of relations) {
    if (PERSON_RELATIONS.has(relation.tipo) && !relation.personId) {
      throw new Error(`${relation.id} exige una persona.`);
    }
    if (relation.tipo === "ESTABLECIMIENTO" && !relation.establishmentId) {
      throw new Error(`${relation.id} exige un establecimiento.`);
    }
    if (COMPANY_RELATIONS.has(relation.tipo) && !relation.relatedCompanyId) {
      throw new Error(`${relation.id} exige una empresa relacionada.`);
    }
    if (relation.tipo === "PERSONA_OTRA_EMPRESA") {
      if (!relation.personId) {
        throw new Error(`${relation.id} exige una persona.`);
      }
      const linkedElsewhere = relations.some(
        (other) => other.personId === relation.personId && other.companyId !== relation.companyId,
      );
      if (!linkedElsewhere) {
        throw new Error(`${relation.id} no está ligada a otra empresa.`);
      }
    }
  }
}
