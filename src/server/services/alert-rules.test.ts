import { describe, expect, it } from "vitest";

import { companies } from "../../../prisma/data/companies";
import { events } from "../../../prisma/data/events";
import { people } from "../../../prisma/data/people";
import { alertRules } from "../../../prisma/data/alert-rules";
import { relations } from "../../../prisma/data/relations";
import { evaluateDemoRules } from "@/server/services/alert-rules";
import { assertRelationIntegrity } from "@/server/services/relation-integrity";

describe("dataset de demostración", () => {
  it("cumple los volúmenes y el caso INNOVA VALLE", () => {
    expect(companies).toHaveLength(22);
    expect(people).toHaveLength(13);
    expect(alertRules).toHaveLength(6);
    expect(events.length).toBeGreaterThanOrEqual(36);
    const innova = companies.find((company) => company.razonSocial === "INNOVA VALLE S.A.S.");
    expect(innova?.nit).toBe("901847263-1");
    expect(innova?.tipoRegistro).toBe("MERCANTIL");
    const horizonte = companies.find((company) => company.razonSocial === "Fundación Horizonte del Pacífico");
    expect(horizonte?.tipoRegistro).toBe("ESAL");
    expect(horizonte?.capital).toBeNull();
    expect(horizonte?.activos).toBeNull();
    expect(() => assertRelationIntegrity(relations)).not.toThrow();
  });

  it("genera al menos tres alertas de Innova y 16 en el padrón", () => {
    const drafts = events.flatMap((event) => evaluateDemoRules(event, alertRules));
    const innova = drafts.filter((draft) => draft.companyId === "co-innova");
    expect(drafts.length).toBeGreaterThanOrEqual(16);
    expect(innova.length).toBeGreaterThanOrEqual(3);
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
