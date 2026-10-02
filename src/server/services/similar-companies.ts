import type { SectorCodigo, TamanoEmpresa } from "@/shared/types/domain";

export interface SimilarCandidate {
  id: string;
  razonSocial: string;
  nit: string;
  sector: SectorCodigo;
  municipio: string;
  tamanoEmpresa: TamanoEmpresa;
  actividadEconomicaCodigo: string;
  revenue: number | null;
}

export function similarScore(target: SimilarCandidate, other: SimilarCandidate): number {
  if (target.id === other.id || target.sector !== other.sector) {
    return 0;
  }
  let score = 0;
  if (target.actividadEconomicaCodigo === other.actividadEconomicaCodigo) {
    score += 4;
  }
  if (target.tamanoEmpresa === other.tamanoEmpresa) {
    score += 3;
  }
  if (
    target.revenue !== null &&
    other.revenue !== null &&
    Number.isFinite(target.revenue) &&
    Number.isFinite(other.revenue) &&
    target.revenue > 0 &&
    other.revenue > 0
  ) {
    const span = Math.max(target.revenue, other.revenue);
    if (span > 0 && Math.abs(target.revenue - other.revenue) / span <= 0.4) {
      score += 3;
    }
  }
  if (target.municipio === other.municipio) {
    score += 1;
  }
  return score;
}

export function rankSimilar<T extends SimilarCandidate>(target: T, pool: T[], limit = 5): { item: T; puntaje: number }[] {
  return pool
    .filter((candidate) => candidate.id !== target.id && candidate.sector === target.sector)
    .map((item) => ({ item, puntaje: similarScore(target, item) }))
    .sort((a, b) => b.puntaje - a.puntaje || a.item.razonSocial.localeCompare(b.item.razonSocial, "es"))
    .slice(0, limit);
}
