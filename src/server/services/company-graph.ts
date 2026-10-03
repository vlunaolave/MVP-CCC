import type { GraphEdge, GraphNode, GraphPayload, RelationItem, VinculoPersona } from "@/shared/types/domain";
import { isoDate } from "@/shared/utils/dates";
import { RELACION_LABEL } from "@/shared/utils/labels";
import { personScopeLabel, vinculoLabel } from "@/shared/utils/person-relations";

function pushCampo(
  campos: GraphNode["data"]["campos"],
  used: Set<string>,
  etiqueta: string,
  valor: string,
) {
  let label = etiqueta;
  let index = 2;
  while (used.has(label)) {
    label = `${etiqueta} (${index})`;
    index += 1;
  }
  used.add(label);
  campos.push({ etiqueta: label, valor });
}

function localRoleLabel(relation: RelationItem): string {
  const base = RELACION_LABEL[relation.tipo];
  return relation.vigente ? base : `${base} · histórica`;
}

function personNodeType(relations: RelationItem[]): GraphNode["type"] {
  if (relations.some((relation) => relation.tipo === "REPRESENTANTE_LEGAL")) {
    return "representante";
  }
  if (relations.some((relation) => relation.tipo === "SOCIO")) {
    return "socio";
  }
  return "persona";
}

function relationNode(relation: RelationItem): GraphNode {
  const titulo = relation.establecimiento?.nombre ?? relation.descripcion;
  const campos: GraphNode["data"]["campos"] = [
    { etiqueta: "Tipo", valor: RELACION_LABEL[relation.tipo] },
    { etiqueta: "Vigencia", valor: relation.vigente ? "Vigente" : "No vigente" },
    { etiqueta: "Desde", valor: isoDate(relation.fechaInicio) },
  ];
  if (relation.fechaFin) {
    campos.push({ etiqueta: "Hasta", valor: isoDate(relation.fechaFin) });
  }
  if (relation.establecimiento) {
    campos.push(
      { etiqueta: "Dirección", valor: relation.establecimiento.direccion },
      { etiqueta: "Municipio", valor: relation.establecimiento.municipio },
      { etiqueta: "Estado", valor: relation.establecimiento.estado === "ABIERTO" ? "Abierto" : "Cerrado" },
    );
  }
  campos.push({ etiqueta: "Descripción", valor: relation.descripcion });
  return {
    id: `rel-${relation.id}`,
    type: "establecimiento",
    data: { titulo, subtitulo: RELACION_LABEL[relation.tipo], campos },
  };
}

function ensureCompanyNode(
  nodes: Map<string, GraphNode>,
  company: { id: string; razonSocial: string; nit: string },
  subtitulo: string,
): string {
  const id = `vinculo-empresa-${company.id}`;
  const existing = nodes.get(id);
  if (existing) {
    if (subtitulo === "Empresa relacionada") {
      existing.data.subtitulo = subtitulo;
    }
    return id;
  }
  nodes.set(id, {
    id,
    type: "relacionada",
    data: {
      titulo: company.razonSocial,
      subtitulo,
      campos: [{ etiqueta: "NIT", valor: company.nit }],
    },
  });
  return id;
}

function personCampos(persona: NonNullable<RelationItem["persona"]>, companyId: string, local: RelationItem[]) {
  const used = new Set<string>();
  const campos: GraphNode["data"]["campos"] = [];
  const alcance = personScopeLabel(persona.vinculos);
  if (alcance) {
    pushCampo(campos, used, "Alcance", alcance);
  }
  pushCampo(campos, used, "Documento", `${persona.tipoDocumento} ${persona.numeroDocumento}`);
  for (const relation of local) {
    const detalle = [relation.descripcion];
    if (relation.porcentajeParticipacion !== null) {
      detalle.push(`${relation.porcentajeParticipacion} % de participación`);
    }
    detalle.push(relation.vigente ? "Vigente" : "No vigente");
    detalle.push(`desde ${isoDate(relation.fechaInicio)}`);
    if (relation.fechaFin) {
      detalle.push(`hasta ${isoDate(relation.fechaFin)}`);
    }
    pushCampo(campos, used, `En esta empresa · ${RELACION_LABEL[relation.tipo]}`, detalle.join(" · "));
  }
  for (const vinculo of persona.vinculos.filter((item) => item.companyId !== companyId)) {
    pushCampo(campos, used, vinculo.razonSocial, `${vinculoLabel(vinculo)} · desde ${isoDate(vinculo.fechaInicio)}`);
  }
  return campos;
}

export function buildCompanyGraph(input: {
  companyId: string;
  company: GraphNode;
  relations: RelationItem[];
}): GraphPayload {
  const nodes: GraphNode[] = [input.company];
  const edges: GraphEdge[] = [];
  const external = new Map<string, GraphNode>();
  const people = new Map<string, RelationItem[]>();

  for (const relation of input.relations) {
    if (relation.persona) {
      const list = people.get(relation.persona.id) ?? [];
      list.push(relation);
      people.set(relation.persona.id, list);
      continue;
    }
    if (relation.tipo === "EMPRESA_RELACIONADA" && relation.empresaRelacionada) {
      const target = ensureCompanyNode(external, relation.empresaRelacionada, "Empresa relacionada");
      const node = external.get(target);
      if (node) {
        node.data.campos.push(
          { etiqueta: "Relación", valor: relation.descripcion },
          { etiqueta: "Vigencia", valor: relation.vigente ? "Vigente" : "No vigente" },
        );
      }
      edges.push({
        id: `edge-${relation.id}`,
        source: input.company.id,
        target,
        label: relation.vigente ? RELACION_LABEL[relation.tipo] : `${RELACION_LABEL[relation.tipo]} · histórica`,
      });
      continue;
    }
    const node = relationNode(relation);
    nodes.push(node);
    edges.push({
      id: `edge-${relation.id}`,
      source: input.company.id,
      target: node.id,
      label: relation.vigente ? RELACION_LABEL[relation.tipo] : `${RELACION_LABEL[relation.tipo]} · histórica`,
    });
  }

  for (const [personId, local] of people) {
    const persona = local[0]?.persona;
    if (!persona) {
      continue;
    }
    const nodeId = `persona-${personId}`;
    const alcance = personScopeLabel(persona.vinculos);
    nodes.push({
      id: nodeId,
      type: personNodeType(local),
      data: {
        titulo: persona.nombre,
        subtitulo: local.map(localRoleLabel).join(" · "),
        nota: alcance ?? undefined,
        campos: personCampos(persona, input.companyId, local),
      },
    });
    edges.push({
      id: `edge-persona-${personId}`,
      source: input.company.id,
      target: nodeId,
      label: local.map(localRoleLabel).join(" · "),
    });
    const linked = new Map<string, VinculoPersona[]>();
    for (const vinculo of persona.vinculos) {
      if (vinculo.companyId === input.companyId) {
        continue;
      }
      const list = linked.get(vinculo.companyId) ?? [];
      list.push(vinculo);
      linked.set(vinculo.companyId, list);
    }
    for (const [companyId, vinculos] of linked) {
      const sample = vinculos[0];
      if (!sample) {
        continue;
      }
      const target = ensureCompanyNode(
        external,
        { id: companyId, razonSocial: sample.razonSocial, nit: sample.nit },
        "Empresa vinculada",
      );
      edges.push({
        id: `edge-persona-${personId}-${companyId}`,
        source: nodeId,
        target,
        label: vinculos.map(vinculoLabel).join(" · "),
      });
    }
  }

  nodes.push(...external.values());
  return { nodes, edges };
}
