import { describe, expect, it } from "vitest";

import { benchmarks } from "../../../prisma/data/benchmarks";
import { companies } from "../../../prisma/data/companies";
import { events } from "../../../prisma/data/events";
import { financials } from "../../../prisma/data/financials";
import { people } from "../../../prisma/data/people";
import { alertRules } from "../../../prisma/data/alert-rules";
import { relations } from "../../../prisma/data/relations";
import { evaluateDemoRules } from "@/server/services/alert-rules";
import { assertRelationIntegrity } from "@/server/services/relation-integrity";
import type { RelationSeed } from "../../../prisma/data/types";

describe("dataset de demostración", () => {
  it("cumple los volúmenes y el caso INNOVA VALLE", () => {
    expect(companies).toHaveLength(50);
    expect(people).toHaveLength(50);
    expect(alertRules).toHaveLength(6);
    expect(events.length).toBeGreaterThanOrEqual(36);
    expect(new Set(companies.map((company) => company.sector)).size).toBe(7);
    expect(benchmarks).toHaveLength(28);
    expect(financials.filter((period) => period.companyId === "co-innova")).toHaveLength(5);
    expect(events.filter((event) => event.companyId === "co-innova").length).toBeGreaterThanOrEqual(10);
    const innova = companies.find((company) => company.razonSocial === "INNOVA VALLE S.A.S.");
    expect(innova?.nit).toBe("901847263-1");
    expect(innova?.tipoRegistro).toBe("MERCANTIL");
    expect(innova?.sector).toBe("TECNOLOGIA");
    expect(innova?.capital).toBe(180000000);
    expect(innova?.activos).toBe(940000000);
    const horizonte = companies.find((company) => company.razonSocial === "Fundación Horizonte del Pacífico");
    expect(horizonte?.tipoRegistro).toBe("ESAL");
    expect(horizonte?.capital).toBeNull();
    expect(horizonte?.activos).toBeNull();
    expect(financials.filter((period) => period.companyId === "co-horizonte")).toHaveLength(0);
    const directivos = relations.filter(
      (relation) =>
        relation.companyId === "co-innova" &&
        relation.vigente &&
        ["REPRESENTANTE_LEGAL", "SUPLENTE", "MIEMBRO_JUNTA", "REVISOR_FISCAL", "OTRO_CARGO"].includes(relation.tipo),
    );
    expect(directivos).toHaveLength(4);
    const socios = relations.filter((relation) => relation.companyId === "co-innova" && relation.tipo === "SOCIO" && relation.vigente);
    expect(socios).toHaveLength(3);
    expect(socios.reduce((sum, relation) => sum + (relation.porcentajeParticipacion ?? 0), 0)).toBe(100);
    expect(
      relations.some(
        (relation) => relation.companyId === "co-innova" && relation.tipo === "SUBSIDIARIA" && relation.relatedCompanyId === "co-innova-labs",
      ),
    ).toBe(true);
    expect(() => assertRelationIntegrity(relations)).not.toThrow();
  });

  it("exige empresa relacionada en matriz y subsidiaria", () => {
    const base = {
      companyId: "co-innova",
      descripcion: "Vínculo",
      fechaInicio: "2024-06-01",
      vigente: true,
    } satisfies Omit<RelationSeed, "id" | "tipo">;
    expect(() => assertRelationIntegrity([{ ...base, id: "sin-matriz", tipo: "MATRIZ" }])).toThrow(/empresa/);
    expect(() => assertRelationIntegrity([{ ...base, id: "sin-sub", tipo: "SUBSIDIARIA" }])).toThrow(/empresa/);
  });

  it("genera al menos cinco alertas de Innova y 16 en el padrón", () => {
    const drafts = events.flatMap((event) => evaluateDemoRules(event, alertRules));
    const innova = drafts.filter((draft) => draft.companyId === "co-innova");
    expect(drafts.length).toBeGreaterThanOrEqual(16);
    expect(innova.length).toBeGreaterThanOrEqual(5);
    expect(innova.map((draft) => draft.titulo)).toEqual(
      expect.arrayContaining([
        "Cambio de dirección",
        "Cambio de actividad económica",
        "Cambio de representante legal",
        "Nueva renovación",
      ]),
    );
  });
});
