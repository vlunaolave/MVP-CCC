export interface AnalysisFacts {
  razonSocial: string;
  periodos: number;
  crecimientoIngresos: number | null;
  crecimientoIngresosPrevio: number | null;
  crecimientoPatrimonio: number | null;
  liquidez: number | null;
  liquidezPrevia: number | null;
  endeudamiento: number | null;
  endeudamientoPrevio: number | null;
  alertas: string[];
  cambios: string[];
  relaciones: number;
  sector: string | null;
  comparacionSector: string | null;
}

export interface CompanyAnalysis {
  resumen: string;
  tendencias: string[];
  cambios: string[];
  monitorear: string[];
  sector: string[];
  aviso: string;
}

export interface AnalysisProvider {
  analyze(facts: AnalysisFacts): Promise<CompanyAnalysis>;
}

const AVISO = "Análisis generado a partir de la información disponible en la plataforma.";

export class RulesAnalysisProvider implements AnalysisProvider {
  async analyze(facts: AnalysisFacts): Promise<CompanyAnalysis> {
    const tendencias: string[] = [];
    const cambios = [...facts.cambios];
    const monitorear: string[] = [];
    const sector: string[] = [];

    if (facts.periodos < 2 && facts.cambios.length === 0 && facts.alertas.length === 0) {
      return {
        resumen: `${facts.razonSocial} no tiene información suficiente en la plataforma para armar un análisis.`,
        tendencias: [],
        cambios: [],
        monitorear: [],
        sector: facts.comparacionSector ? [facts.comparacionSector] : [],
        aviso: AVISO,
      };
    }

    if (facts.crecimientoIngresos !== null && facts.crecimientoIngresosPrevio !== null && facts.crecimientoIngresos > 0 && facts.crecimientoIngresosPrevio > 0) {
      tendencias.push("Los ingresos crecieron en los dos últimos periodos disponibles.");
    } else if (facts.crecimientoIngresos !== null && facts.crecimientoIngresos < 0) {
      tendencias.push("Los ingresos del último periodo son inferiores a los del periodo anterior.");
    } else if (facts.crecimientoIngresos !== null) {
      tendencias.push("Los ingresos del último periodo están disponibles para compararlos con el anterior.");
    }

    if (facts.crecimientoPatrimonio !== null && facts.crecimientoPatrimonio > 0) {
      tendencias.push("El patrimonio aumentó frente al periodo anterior.");
    } else if (facts.crecimientoPatrimonio !== null && facts.crecimientoPatrimonio < 0) {
      tendencias.push("El patrimonio disminuyó frente al periodo anterior.");
    }

    if (facts.liquidez !== null && facts.liquidezPrevia !== null) {
      const delta = facts.liquidez - facts.liquidezPrevia;
      if (Math.abs(delta) < 0.15) tendencias.push("La liquidez se mantiene estable entre los dos últimos periodos.");
      else if (delta > 0) tendencias.push("La razón corriente aumentó en el último periodo.");
      else tendencias.push("La razón corriente disminuyó en el último periodo.");
    }

    if (facts.endeudamiento !== null && facts.endeudamientoPrevio !== null) {
      const delta = facts.endeudamiento - facts.endeudamientoPrevio;
      if (delta > 0.02) tendencias.push("El nivel de endeudamiento aumentó en el último periodo.");
      else if (delta < -0.02) tendencias.push("El nivel de endeudamiento disminuyó en el último periodo.");
      else tendencias.push("El nivel de endeudamiento se mantuvo similar al periodo anterior.");
    }

    if (facts.alertas.length > 0) {
      monitorear.push(`Alertas registradas: ${facts.alertas.join("; ")}.`);
    }
    if (facts.endeudamiento !== null && facts.endeudamiento >= 0.6) {
      monitorear.push("El endeudamiento del último periodo está por encima del 60 %.");
    }
    if (facts.liquidez !== null && facts.liquidez < 1) {
      monitorear.push("La razón corriente del último periodo es inferior a 1.");
    }
    if (monitorear.length === 0 && facts.periodos > 0) {
      monitorear.push("No hay señales adicionales en los datos disponibles.");
    }

    if (facts.comparacionSector) sector.push(facts.comparacionSector);
    else if (facts.sector) sector.push(`La empresa está clasificada en ${facts.sector}. No hay promedio sectorial suficiente para comparar.`);
    else sector.push("No hay comparación sectorial disponible.");

    const partes: string[] = [];
    if (facts.periodos >= 2) {
      partes.push(`Durante los últimos ${Math.min(facts.periodos, 3)} periodos con información, ${facts.razonSocial} tiene estados financieros en la plataforma.`);
    }
    if (tendencias[0]) partes.push(tendencias[0]);
    if (facts.cambios.length > 0) {
      partes.push(`Se identifican ${facts.cambios.length} cambio${facts.cambios.length === 1 ? "" : "s"} reciente${facts.cambios.length === 1 ? "" : "s"}.`);
    }
    if (facts.alertas.length > 0) {
      partes.push(`Hay ${facts.alertas.length} alerta${facts.alertas.length === 1 ? "" : "s"} asociada${facts.alertas.length === 1 ? "" : "s"} a la empresa.`);
    }
    if (facts.relaciones > 0) {
      partes.push(`El perfil registra ${facts.relaciones} ${facts.relaciones === 1 ? "relación empresarial" : "relaciones empresariales"}.`);
    }

    return {
      resumen: partes.join(" ") || `${facts.razonSocial} tiene información parcial en la plataforma.`,
      tendencias,
      cambios,
      monitorear,
      sector,
      aviso: AVISO,
    };
  }
}

export function analysisProvider(): AnalysisProvider {
  return new RulesAnalysisProvider();
}
