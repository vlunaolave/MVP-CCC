import type { RelationSeed } from "../../../prisma/data/types";

export function assertRelationIntegrity(relations: RelationSeed[]): void {
  for (const relation of relations) {
    if ((relation.tipo === "REPRESENTANTE_LEGAL" || relation.tipo === "SOCIO") && !relation.personId) {
      throw new Error(`${relation.id} exige una persona.`);
    }
    if (relation.tipo === "ESTABLECIMIENTO" && !relation.establishmentId) {
      throw new Error(`${relation.id} exige un establecimiento.`);
    }
    if (relation.tipo === "EMPRESA_RELACIONADA" && !relation.relatedCompanyId) {
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
