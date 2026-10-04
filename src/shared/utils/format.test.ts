import { describe, expect, it } from "vitest";

import { formatCOP, formatCOPCompact, formatDate, formatNumber, formatPercentage } from "@/shared/utils/format";

describe("formato colombiano", () => {
  it("muestra pesos completos y compactos", () => {
    expect(formatCOP(3_970_000_000)).toBe("$ 3.970.000.000");
    expect(formatCOP(448_000_000)).toBe("$ 448.000.000");
    expect(formatCOPCompact(3_970_000_000)).toBe("$ 3,97 mil M");
    expect(formatCOPCompact(448_000_000)).toBe("$ 448 M");
    expect(formatCOPCompact(184_500_000)).toBe("$ 184,5 M");
  });

  it("formatea porcentaje, número y fecha", () => {
    expect(formatPercentage(0.1546)).toBe("15,46 %");
    expect(formatNumber(12500)).toBe("12.500");
    expect(formatDate("2026-09-30T00:00:00")).toBe("30/09/2026");
    expect(formatPercentage(Number.NaN)).toBe("N/D");
    expect(formatCOP(Number.POSITIVE_INFINITY)).toBe("N/D");
  });
});
