"use client";

import {
  Background,
  Controls,
  ReactFlow,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import { useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";

import type { GraphNode, GraphPayload } from "@/shared/types/domain";
import { cn } from "cn";

type FlowNode = Node<GraphNode["data"], GraphNode["type"]>;

const shapeClass: Record<GraphNode["type"], string> = {
  empresa: "rounded-xl border-2 border-primary bg-primary text-primary-foreground min-w-44",
  representante: "rounded-md border-2 border-important bg-important text-white min-w-40",
  socio: "rounded-full border border-primary/40 bg-card px-4 min-w-36",
  persona: "rounded-full border border-dashed border-foreground/30 bg-muted min-w-36",
  establecimiento: "rounded-sm border-2 border-foreground/20 bg-card min-w-40",
  relacionada: "rounded-xl border border-primary bg-card text-primary min-w-44",
};

function GraphCard({ data, type }: { data: GraphNode["data"]; type?: string }) {
  const kind = (type ?? "persona") as GraphNode["type"];
  return (
    <div className={cn("px-3 py-2 text-center shadow-sm", shapeClass[kind])}>
      <p className="text-[10px] tracking-wide uppercase opacity-80">{data.subtitulo}</p>
      <p className="text-sm font-semibold">{data.titulo}</p>
    </div>
  );
}

function FlowNodeView({ data, type }: NodeProps<FlowNode>) {
  return <GraphCard data={data} type={type} />;
}

const nodeTypes: NodeTypes = {
  empresa: FlowNodeView,
  representante: FlowNodeView,
  socio: FlowNodeView,
  persona: FlowNodeView,
  establecimiento: FlowNodeView,
  relacionada: FlowNodeView,
};

export function CompanyGraph({ graph }: { graph: GraphPayload }) {
  const [selectedId, setSelectedId] = useState<string | null>(graph.nodes[0]?.id ?? null);
  const nodes = useMemo<FlowNode[]>(
    () =>
      graph.nodes.map((node, index) => {
        const angle = ((index - 1) / Math.max(graph.nodes.length - 1, 1)) * Math.PI * 2;
        const position = index === 0 ? { x: 280, y: 180 } : { x: 280 + Math.cos(angle) * 260, y: 180 + Math.sin(angle) * 170 };
        return { id: node.id, type: node.type, data: node.data, position };
      }),
    [graph.nodes],
  );
  const edges = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
  }));
  const selected = graph.nodes.find((node) => node.id === selectedId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="h-[420px] overflow-hidden rounded-xl border bg-card lg:h-[560px]" aria-label="Grafo de relaciones">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.4}
          maxZoom={1.8}
          onNodeClick={(_, node) => setSelectedId(node.id)}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <aside className="rounded-xl border bg-card p-4 shadow-sm">
        {selected ? (
          <div className="grid gap-3">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">{selected.data.subtitulo}</p>
              <h3 className="text-lg font-semibold">{selected.data.titulo}</h3>
            </div>
            <dl className="grid gap-2">
              {selected.data.campos.map((campo) => (
                <div key={campo.etiqueta}>
                  <dt className="text-xs text-muted-foreground">{campo.etiqueta}</dt>
                  <dd className="text-sm">{campo.valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Selecciona un nodo para ver su detalle.</p>
        )}
      </aside>
    </div>
  );
}
