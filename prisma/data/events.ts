import { companies } from "./companies";
import type { EventSeed } from "./types";

function previousYear(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${Number(year) - 1}-${month}-${day}`;
}

function fuenteOf(companyId: string): EventSeed["fuente"] {
  const company = companies.find((item) => item.id === companyId);
  return company?.tipoRegistro === "ESAL" ? "ESAL" : "REGISTRO_MERCANTIL";
}

const renewalAlertCompanies = new Set([
  "co-nube",
  "co-andes",
  "co-rutas",
  "co-cafe",
  "co-agro",
  "co-ladrillo",
  "co-recicladores",
  "co-metal",
]);

const handcrafted = new Set(["co-innova", "co-horizonte"]);

const innova: EventSeed[] = [
  {
    id: "ev-innova-const",
    companyId: "co-innova",
    tipo: "CONSTITUCION",
    fecha: "2018-02-20",
    titulo: "Constitución de la sociedad",
    descripcion: "Se constituye INNOVA VALLE S.A.S.",
    fuente: "REGISTRO_MERCANTIL",
  },
  {
    id: "ev-innova-mat",
    companyId: "co-innova",
    tipo: "MATRICULA",
    fecha: "2018-03-12",
    titulo: "Matrícula mercantil",
    descripcion: "Matrícula 543210-1 en la Cámara de Comercio de Cali.",
    fuente: "REGISTRO_MERCANTIL",
  },
  ...["2019-03-08", "2020-03-06", "2021-03-05", "2022-03-04", "2023-03-03", "2024-03-04", "2025-03-04"].map(
    (fecha, index) => ({
      id: `ev-innova-ren-${index + 2019}`,
      companyId: "co-innova" as const,
      tipo: "RENOVACION" as const,
      fecha,
      titulo: "Renovación de matrícula",
      descripcion: `Renovación anual registrada el ${fecha}.`,
      fuente: "REGISTRO_MERCANTIL" as const,
    }),
  ),
  {
    id: "ev-innova-domicilio",
    companyId: "co-innova",
    tipo: "CAMBIO_DOMICILIO",
    fecha: "2022-11-03",
    titulo: "Cambio de domicilio",
    descripcion: "El domicilio pasa de Carrera 5 # 12-40 a Carrera 100 # 16-20, Oficina 804.",
    fuente: "REGISTRO_MERCANTIL",
    metadata: {
      valorAnterior: "Carrera 5 # 12-40",
      valorNuevo: "Carrera 100 # 16-20, Oficina 804",
    },
  },
  {
    id: "ev-innova-actividad",
    companyId: "co-innova",
    tipo: "MODIFICACION_ACTIVIDAD",
    fecha: "2023-08-21",
    titulo: "Cambio de actividad económica",
    descripcion: "La actividad principal pasa de CIIU 6202 a CIIU 6201.",
    fuente: "REGISTRO_MERCANTIL",
    metadata: { valorAnterior: "6202", valorNuevo: "6201" },
  },
  {
    id: "ev-innova-rl",
    companyId: "co-innova",
    tipo: "CAMBIO_REPRESENTANTE",
    fecha: "2024-01-16",
    titulo: "Cambio de representante legal",
    descripcion: "Helena Suárez Patiño deja la representación. Asume Mariana Restrepo Quintero.",
    fuente: "REGISTRO_MERCANTIL",
    metadata: {
      valorAnterior: "Helena Suárez Patiño",
      valorNuevo: "Mariana Restrepo Quintero",
    },
  },
  {
    id: "ev-innova-est",
    companyId: "co-innova",
    tipo: "APERTURA_ESTABLECIMIENTO",
    fecha: "2024-06-01",
    titulo: "Apertura de establecimiento",
    descripcion: "Apertura de Innova Valle Lab en Calle 64N # 5B-20, Cali.",
    fuente: "REGISTRO_MERCANTIL",
  },
  {
    id: "ev-innova-ren-2026",
    companyId: "co-innova",
    tipo: "RENOVACION",
    fecha: "2026-03-02",
    titulo: "Renovación de matrícula",
    descripcion: "Renovación de la matrícula mercantil correspondiente a 2026.",
    fuente: "REGISTRO_MERCANTIL",
    metadata: { valorAnterior: "2025-03-04", valorNuevo: "2026-03-02" },
  },
];

const horizonte: EventSeed[] = [
  {
    id: "ev-horizonte-const",
    companyId: "co-horizonte",
    tipo: "CONSTITUCION",
    fecha: "2015-06-08",
    titulo: "Constitución",
    descripcion: "Se constituye la Fundación Horizonte del Pacífico.",
    fuente: "ESAL",
  },
  {
    id: "ev-horizonte-mat",
    companyId: "co-horizonte",
    tipo: "MATRICULA",
    fecha: "2015-07-01",
    titulo: "Registro ESAL",
    descripcion: "Registro 887711-2 en la Cámara de Comercio de Cali.",
    fuente: "ESAL",
  },
  {
    id: "ev-horizonte-ren-2018",
    companyId: "co-horizonte",
    tipo: "RENOVACION",
    fecha: "2018-02-10",
    titulo: "Renovación",
    descripcion: "Renovación del registro ESAL.",
    fuente: "ESAL",
  },
  {
    id: "ev-horizonte-ren-2020",
    companyId: "co-horizonte",
    tipo: "RENOVACION",
    fecha: "2020-02-14",
    titulo: "Renovación",
    descripcion: "Renovación del registro ESAL.",
    fuente: "ESAL",
  },
  {
    id: "ev-horizonte-domicilio",
    companyId: "co-horizonte",
    tipo: "CAMBIO_DOMICILIO",
    fecha: "2021-09-14",
    titulo: "Cambio de domicilio",
    descripcion: "El domicilio pasa de Calle 5 # 22-10 a Calle 9 # 44-18.",
    fuente: "ESAL",
    metadata: { valorAnterior: "Calle 5 # 22-10", valorNuevo: "Calle 9 # 44-18" },
  },
  {
    id: "ev-horizonte-rl",
    companyId: "co-horizonte",
    tipo: "CAMBIO_REPRESENTANTE",
    fecha: "2023-04-02",
    titulo: "Cambio de representante legal",
    descripcion: "Rodrigo Alonso Peña Gil deja la representación. Asume Lucía Elena Vargas Mora.",
    fuente: "ESAL",
    metadata: {
      valorAnterior: "Rodrigo Alonso Peña Gil",
      valorNuevo: "Lucía Elena Vargas Mora",
    },
  },
  {
    id: "ev-horizonte-ren-2024",
    companyId: "co-horizonte",
    tipo: "RENOVACION",
    fecha: "2024-02-16",
    titulo: "Renovación",
    descripcion: "Renovación del registro ESAL.",
    fuente: "ESAL",
  },
  {
    id: "ev-horizonte-ren-2026",
    companyId: "co-horizonte",
    tipo: "RENOVACION",
    fecha: "2026-02-18",
    titulo: "Renovación",
    descripcion: "Renovación del registro ESAL correspondiente a 2026.",
    fuente: "ESAL",
    metadata: { valorAnterior: "2025-02-20", valorNuevo: "2026-02-18" },
  },
];

const specials: EventSeed[] = [
  {
    id: "ev-barrio-org",
    companyId: "co-barrio",
    tipo: "CAMBIO_TIPO_ORGANIZACION",
    fecha: "2024-09-12",
    titulo: "Cambio de tipo de organización",
    descripcion: "La sociedad pasa de LTDA a S.A.S.",
    fuente: "REGISTRO_MERCANTIL",
    metadata: { valorAnterior: "LTDA", valorNuevo: "S.A.S." },
  },
  {
    id: "ev-metal-estado",
    companyId: "co-metal",
    tipo: "CAMBIO_ESTADO_MATRICULA",
    fecha: "2025-06-18",
    titulo: "Cambio del estado de matrícula",
    descripcion: "La matrícula pasa de suspendida a activa.",
    fuente: "REGISTRO_MERCANTIL",
    metadata: { valorAnterior: "SUSPENDIDA", valorNuevo: "ACTIVA" },
  },
  {
    id: "ev-bienestar-actividad",
    companyId: "co-bienestar",
    tipo: "MODIFICACION_ACTIVIDAD",
    fecha: "2025-11-07",
    titulo: "Cambio de actividad económica",
    descripcion: "La actividad principal pasa de CIIU 8690 a CIIU 8699.",
    fuente: "REGISTRO_MERCANTIL",
    metadata: { valorAnterior: "8690", valorNuevo: "8699" },
  },
];

const generated: EventSeed[] = companies
  .filter((company) => !handcrafted.has(company.id))
  .flatMap((company) => {
    const fuente = fuenteOf(company.id);
    const items: EventSeed[] = [
      {
        id: `ev-${company.id}-const`,
        companyId: company.id,
        tipo: "CONSTITUCION",
        fecha: company.fechaConstitucion ?? company.fechaMatricula,
        titulo: "Constitución",
        descripcion: `Constitución de ${company.razonSocial}.`,
        fuente,
      },
      {
        id: `ev-${company.id}-mat`,
        companyId: company.id,
        tipo: "MATRICULA",
        fecha: company.fechaMatricula,
        titulo: company.tipoRegistro === "ESAL" ? "Registro ESAL" : "Matrícula mercantil",
        descripcion: `Número de matrícula ${company.numeroMatricula}.`,
        fuente,
      },
    ];
    if (company.fechaRenovacion) {
      const renewal: EventSeed = {
        id: `ev-${company.id}-ren`,
        companyId: company.id,
        tipo: "RENOVACION",
        fecha: company.fechaRenovacion,
        titulo: "Renovación de matrícula",
        descripcion: `Renovación registrada el ${company.fechaRenovacion}.`,
        fuente,
      };
      if (renewalAlertCompanies.has(company.id)) {
        renewal.metadata = {
          valorAnterior: previousYear(company.fechaRenovacion),
          valorNuevo: company.fechaRenovacion,
        };
      }
      items.push(renewal);
    }
    return items;
  });

export const events: EventSeed[] = [...innova, ...horizonte, ...specials, ...generated].sort((a, b) =>
  a.fecha.localeCompare(b.fecha),
);
