import { companies } from "./companies";
import { extraRepresentatives } from "./companies-extra";
import { establishments } from "./establishments";
import { personName } from "./people";
import type { RelationSeed } from "./types";

const currentRepresentative: Record<string, { personId: string; desde: string }> = {
  "co-innova": { personId: "per-mariana", desde: "2024-01-16" },
  "co-horizonte": { personId: "per-lucia", desde: "2023-04-02" },
  "co-nube": { personId: "per-valeria", desde: "2019-04-02" },
  "co-andes": { personId: "per-diego", desde: "2016-07-11" },
  "co-cafe": { personId: "per-paula", desde: "2020-01-20" },
  "co-brio": { personId: "per-hernan", desde: "2008-09-15" },
  "co-mercado": { personId: "per-natalia", desde: "2021-05-03" },
  "co-rutas": { personId: "per-samuel", desde: "2017-02-01" },
  "co-bienestar": { personId: "per-elena", desde: "2021-12-02" },
  "co-marea": { personId: "per-camilo", desde: "2014-03-01" },
  "co-agro": { personId: "per-andres", desde: "2019-08-01" },
  "co-ladrillo": { personId: "per-helena", desde: "2012-04-11" },
  "co-recicladores": { personId: "per-rodrigo", desde: "2016-08-20" },
  "co-faro": { personId: "per-camilo", desde: "2013-08-02" },
  "co-textiles": { personId: "per-natalia", desde: "2015-02-02" },
  "co-barrio": { personId: "per-diego", desde: "2018-05-09" },
  "co-horno": { personId: "per-paula", desde: "2023-06-15" },
  "co-punto": { personId: "per-samuel", desde: "2011-10-04" },
  "co-frio": { personId: "per-hernan", desde: "2018-07-01" },
  "co-semilla": { personId: "per-lucia", desde: "2017-03-14" },
  "co-metal": { personId: "per-elena", desde: "2004-01-09" },
  "co-bahia": { personId: "per-valeria", desde: "2020-09-01" },
  ...extraRepresentatives,
};

const representativeRelations: RelationSeed[] = companies.map((company) => {
  const current = currentRepresentative[company.id];
  if (!current) {
    throw new Error(`Sin representante vigente para ${company.id}`);
  }
  return {
    id: `rel-rl-${company.id}`,
    companyId: company.id,
    tipo: "REPRESENTANTE_LEGAL",
    personId: current.personId,
    descripcion: `Representante legal: ${personName(current.personId)}.`,
    fechaInicio: current.desde,
    vigente: true,
  };
});

const extraRelations: RelationSeed[] = [
  {
    id: "rel-rl-innova-helena",
    companyId: "co-innova",
    tipo: "REPRESENTANTE_LEGAL",
    personId: "per-helena",
    descripcion: "Representante legal hasta el 16 de enero de 2024.",
    fechaInicio: "2018-02-20",
    fechaFin: "2024-01-16",
    vigente: false,
  },
  {
    id: "rel-socio-innova-mariana",
    companyId: "co-innova",
    tipo: "SOCIO",
    personId: "per-mariana",
    descripcion: "Socia de INNOVA VALLE S.A.S.",
    porcentajeParticipacion: 50,
    fechaInicio: "2018-02-20",
    vigente: true,
  },
  {
    id: "rel-socio-innova-andres",
    companyId: "co-innova",
    tipo: "SOCIO",
    personId: "per-andres",
    descripcion: "Socio de INNOVA VALLE S.A.S.",
    porcentajeParticipacion: 35,
    fechaInicio: "2018-02-20",
    vigente: true,
  },
  {
    id: "rel-est-innova",
    companyId: "co-innova",
    tipo: "ESTABLECIMIENTO",
    establishmentId: "est-innova",
    descripcion: "Establecimiento Innova Valle Lab.",
    fechaInicio: "2024-06-01",
    vigente: true,
  },
  {
    id: "rel-emp-innova-nube",
    companyId: "co-innova",
    tipo: "EMPRESA_RELACIONADA",
    relatedCompanyId: "co-nube",
    descripcion: "Aliado tecnológico de infraestructura.",
    fechaInicio: "2024-06-01",
    vigente: true,
  },
  {
    id: "rel-suplente-innova",
    companyId: "co-innova",
    tipo: "SUPLENTE",
    personId: "per-tomas",
    descripcion: "Suplente del representante legal.",
    fechaInicio: "2024-01-16",
    vigente: true,
  },
  {
    id: "rel-junta-innova",
    companyId: "co-innova",
    tipo: "MIEMBRO_JUNTA",
    personId: "per-isabel",
    cargo: "Presidenta de junta",
    descripcion: "Presidenta de junta de INNOVA VALLE S.A.S.",
    fechaInicio: "2021-03-01",
    vigente: true,
  },
  {
    id: "rel-revisor-innova",
    companyId: "co-innova",
    tipo: "REVISOR_FISCAL",
    personId: "per-jorge",
    descripcion: "Revisor fiscal de INNOVA VALLE S.A.S.",
    fechaInicio: "2023-04-01",
    vigente: true,
  },
  {
    id: "rel-socio-innova-sara",
    companyId: "co-innova",
    tipo: "SOCIO",
    personId: "per-sara",
    descripcion: "Socia de INNOVA VALLE S.A.S.",
    porcentajeParticipacion: 15,
    fechaInicio: "2022-06-01",
    vigente: true,
  },
  {
    id: "rel-est-innova-norte",
    companyId: "co-innova",
    tipo: "ESTABLECIMIENTO",
    establishmentId: "est-innova-norte",
    descripcion: "Establecimiento Innova Valle Norte.",
    fechaInicio: "2025-02-01",
    vigente: true,
  },
  {
    id: "rel-sub-innova-labs",
    companyId: "co-innova",
    tipo: "SUBSIDIARIA",
    relatedCompanyId: "co-innova-labs",
    descripcion: "Subsidiaria de desarrollo de producto.",
    fechaInicio: "2024-06-01",
    vigente: true,
  },
  {
    id: "rel-matriz-labs-innova",
    companyId: "co-innova-labs",
    tipo: "MATRIZ",
    relatedCompanyId: "co-innova",
    descripcion: "Matriz: INNOVA VALLE S.A.S.",
    fechaInicio: "2024-06-01",
    vigente: true,
  },
  {
    id: "rel-rl-horizonte-rodrigo",
    companyId: "co-horizonte",
    tipo: "REPRESENTANTE_LEGAL",
    personId: "per-rodrigo",
    descripcion: "Representante legal hasta el 2 de abril de 2023.",
    fechaInicio: "2015-06-08",
    fechaFin: "2023-04-02",
    vigente: false,
  },
  {
    id: "rel-socio-horizonte-camilo",
    companyId: "co-horizonte",
    tipo: "SOCIO",
    personId: "per-camilo",
    descripcion: "Miembro fundador.",
    fechaInicio: "2015-06-08",
    vigente: true,
  },
  {
    id: "rel-est-horizonte",
    companyId: "co-horizonte",
    tipo: "ESTABLECIMIENTO",
    establishmentId: "est-horizonte",
    descripcion: "Sede Horizonte.",
    fechaInicio: "2021-09-14",
    vigente: true,
  },
  {
    id: "rel-persona-nube-andres",
    companyId: "co-nube",
    tipo: "PERSONA_OTRA_EMPRESA",
    personId: "per-andres",
    descripcion: "Persona también vinculada a INNOVA VALLE S.A.S. como socio.",
    fechaInicio: "2024-06-01",
    vigente: true,
  },
  {
    id: "rel-persona-agro-mariana",
    companyId: "co-agro",
    tipo: "PERSONA_OTRA_EMPRESA",
    personId: "per-mariana",
    descripcion: "Persona también vinculada a INNOVA VALLE S.A.S. como representante legal.",
    fechaInicio: "2025-01-20",
    vigente: true,
  },
  {
    id: "rel-emp-rutas-andes",
    companyId: "co-rutas",
    tipo: "EMPRESA_RELACIONADA",
    relatedCompanyId: "co-andes",
    descripcion: "Operación logística compartida en el corredor Yumbo–Buenaventura.",
    fechaInicio: "2023-05-09",
    vigente: true,
  },
];

for (const establishment of establishments) {
  if (establishment.id === "est-innova" || establishment.id === "est-horizonte" || establishment.id === "est-innova-norte") {
    continue;
  }
  extraRelations.push({
    id: `rel-${establishment.id}`,
    companyId: establishment.companyId,
    tipo: "ESTABLECIMIENTO",
    establishmentId: establishment.id,
    descripcion: `Establecimiento ${establishment.nombre}.`,
    fechaInicio: "2022-01-15",
    vigente: establishment.estado === "ABIERTO",
  });
}

export const relations: RelationSeed[] = [...representativeRelations, ...extraRelations];
