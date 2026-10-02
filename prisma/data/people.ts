import type { PersonSeed } from "./types";

export const people: PersonSeed[] = [
  { id: "per-mariana", nombre: "Mariana Restrepo Quintero", tipoDocumento: "CC", numeroDocumento: "1098001101" },
  { id: "per-andres", nombre: "Andrés Felipe Caicedo Ríos", tipoDocumento: "CC", numeroDocumento: "1098001102" },
  { id: "per-helena", nombre: "Helena Suárez Patiño", tipoDocumento: "CC", numeroDocumento: "1098001103" },
  { id: "per-lucia", nombre: "Lucía Elena Vargas Mora", tipoDocumento: "CC", numeroDocumento: "1098001104" },
  { id: "per-camilo", nombre: "Camilo Andrés Muñoz Díaz", tipoDocumento: "CC", numeroDocumento: "1098001105" },
  { id: "per-rodrigo", nombre: "Rodrigo Alonso Peña Gil", tipoDocumento: "CC", numeroDocumento: "1098001106" },
  { id: "per-valeria", nombre: "Valeria Soto Henao", tipoDocumento: "CC", numeroDocumento: "1098001107" },
  { id: "per-diego", nombre: "Diego Armando Cifuentes Lara", tipoDocumento: "CC", numeroDocumento: "1098001108" },
  { id: "per-paula", nombre: "Paula Andrea Giraldo Mesa", tipoDocumento: "CC", numeroDocumento: "1098001109" },
  { id: "per-hernan", nombre: "Hernán Darío Ospina Cruz", tipoDocumento: "CC", numeroDocumento: "1098001110" },
  { id: "per-natalia", nombre: "Natalia Jiménez Bolaños", tipoDocumento: "CC", numeroDocumento: "1098001111" },
  { id: "per-samuel", nombre: "Samuel Esteban Rivas Cobo", tipoDocumento: "CC", numeroDocumento: "1098001112" },
  { id: "per-elena", nombre: "Elena Marcela Pardo Ruiz", tipoDocumento: "CC", numeroDocumento: "1098001113" },
];

export function personName(id: string): string {
  const person = people.find((item) => item.id === id);
  if (!person) {
    throw new Error(`Persona desconocida: ${id}`);
  }
  return person.nombre;
}
