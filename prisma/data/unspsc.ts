import { companies } from "./companies";
import type { UnspscSeed } from "./types";

export interface UnspscCatalogItem {
  code: string;
  segment: string;
  family: string;
  clase: string;
  commodity: string;
  description: string;
}

const NOTE = "Descripción demostrativa. No es el texto oficial UNSPSC.";

export const unspscCatalog: UnspscCatalogItem[] = [
  { code: "43232304", segment: "43", family: "4323", clase: "432323", commodity: "43232304", description: `Software de gestión empresarial. ${NOTE}` },
  { code: "81111508", segment: "81", family: "8111", clase: "811115", commodity: "81111508", description: `Servicios de desarrollo de software. ${NOTE}` },
  { code: "81112005", segment: "81", family: "8111", clase: "811120", commodity: "81112005", description: `Servicios de soporte técnico. ${NOTE}` },
  { code: "43211503", segment: "43", family: "4321", clase: "432115", commodity: "43211503", description: `Computadores de escritorio. ${NOTE}` },
  { code: "53101501", segment: "53", family: "5310", clase: "531015", commodity: "53101501", description: `Vestuario de uso general. ${NOTE}` },
  { code: "50161509", segment: "50", family: "5016", clase: "501615", commodity: "50161509", description: `Alimentos preparados. ${NOTE}` },
  { code: "72101501", segment: "72", family: "7210", clase: "721015", commodity: "72101501", description: `Servicios de construcción de edificaciones. ${NOTE}` },
  { code: "78101801", segment: "78", family: "7810", clase: "781018", commodity: "78101801", description: `Transporte de carga por carretera. ${NOTE}` },
  { code: "85101501", segment: "85", family: "8510", clase: "851015", commodity: "85101501", description: `Servicios de consulta médica. ${NOTE}` },
  { code: "30111501", segment: "30", family: "3011", clase: "301115", commodity: "30111501", description: `Componentes metálicos estructurales. ${NOTE}` },
  { code: "24111501", segment: "24", family: "2411", clase: "241115", commodity: "24111501", description: `Empaques de cartón. ${NOTE}` },
  { code: "80101501", segment: "80", family: "8010", clase: "801015", commodity: "80101501", description: `Servicios de asesoría empresarial. ${NOTE}` },
];

const innovaCodes = ["43232304", "81111508", "81112005", "43211503"];

function hash(value: string): number {
  let result = 0;
  for (const char of value) {
    result = (result * 33 + char.charCodeAt(0)) >>> 0;
  }
  return result;
}

function byCode(code: string): UnspscCatalogItem {
  const item = unspscCatalog.find((entry) => entry.code === code);
  if (!item) {
    throw new Error(`Código UNSPSC de demostración no catalogado: ${code}`);
  }
  return item;
}

function row(companyId: string, item: UnspscCatalogItem, isPrimary: boolean): UnspscSeed {
  return { id: `unspsc-${companyId}-${item.code}`, companyId, ...item, isPrimary };
}

const empty = new Set(["co-horizonte", "co-faro", "co-semilla", "co-recicladores", "co-horno", "co-cafe", "co-marea", "co-vitrina"]);

export const unspscClassifications: UnspscSeed[] = companies.flatMap((company) => {
  if (empty.has(company.id)) {
    return [];
  }
  if (company.id === "co-innova") {
    return innovaCodes.map((code, index) => row(company.id, byCode(code), index === 0));
  }
  const start = hash(company.id) % unspscCatalog.length;
  const count = 1 + (hash(`${company.id}-n`) % 3);
  return Array.from({ length: count }, (_, index) => {
    const item = unspscCatalog[(start + index) % unspscCatalog.length];
    return item ? row(company.id, item, index === 0) : null;
  }).filter((item): item is UnspscSeed => item !== null);
});
