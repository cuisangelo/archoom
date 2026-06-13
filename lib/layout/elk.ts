import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { Doc, NodeDef } from '../dsl/types';

const elk = new ELK();

const NODE_HEIGHT = 56;
const EDGE_COLOR = '#A3AAB8';

const DIR = { right: 'RIGHT', left: 'LEFT', down: 'DOWN', up: 'UP' } as const;

function nodeWidth(n: NodeDef): number {
  return Math.round(Math.min(300, Math.max(130, 16 + 30 + 11 + n.label.length * 7.4 + 16)));
}

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

export async function layoutDoc(doc: Doc): Promise<LayoutResult> {
  if (doc.nodes.size === 0) return { nodes: [], edges: [] };

  const toElk = (id: string): ElkNode => {
    const n = doc.nodes.get(id)!;
    if (n.isGroup && n.children.length) {
      return {
        id,
        layoutOptions: { 'elk.padding': '[top=56,left=28,bottom=28,right=28]' },
        children: n.children.map(toElk),
      };
    }
    if (n.isGroup) return { id, width: 200, height: 110 };
    return { id, width: nodeWidth(n), height: NODE_HEIGHT };
  };

  const isAncestor = (a: string, b: string): boolean => {
    let cur = doc.nodes.get(b)?.parent;
    while (cur) {
      if (cur === a) return true;
      cur = doc.nodes.get(cur)?.parent;
    }
    return false;
  };

  const validEdges = doc.edges.filter(
    (e) =>
      doc.nodes.has(e.source) &&
      doc.nodes.has(e.target) &&
      !isAncestor(e.source, e.target) &&
      !isAncestor(e.target, e.source),
  );

  const graph: ElkNode = {
    id: '__root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': DIR[doc.direction],
      'elk.layered.spacing.nodeNodeBetweenLayers': '100',
      'elk.spacing.nodeNode': '54',
      'elk.spacing.edgeNode': '24',
      'elk.spacing.edgeEdge': '16',
      'elk.layered.spacing.edgeNodeBetweenLayers': '28',
      'elk.spacing.componentComponent': '72',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.thoroughness': '12',
    },
    children: doc.rootIds.map(toElk),
    edges: validEdges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  };

  const laidOut = await elk.layout(graph);

  const rfNodes: Node[] = [];
  const centers = new Map<string, { x: number; y: number }>();

  const walk = (
    parent: ElkNode,
    parentAbs: { x: number; y: number },
    parentId: string | undefined,
  ) => {
    for (const child of parent.children ?? []) {
      const def = doc.nodes.get(child.id)!;
      const abs = { x: parentAbs.x + (child.x ?? 0), y: parentAbs.y + (child.y ?? 0) };
      centers.set(child.id, {
        x: abs.x + (child.width ?? 0) / 2,
        y: abs.y + (child.height ?? 0) / 2,
      });
      const base = {
        id: child.id,
        position: { x: child.x ?? 0, y: child.y ?? 0 },
        data: {
          label: def.label,
          icon: def.icon,
          color: def.color,
          hasNote: false,
        },
        ...(parentId ? { parentId, extent: 'parent' as const } : {}),
      };
      if (def.isGroup) {
        rfNodes.push({
          ...base,
          type: 'archGroup',
          style: { width: child.width, height: child.height },
        });
        walk(child, abs, child.id);
      } else {
        rfNodes.push({
          ...base,
          type: 'archNode',
          width: child.width,
          height: child.height,
        });
      }
    }
  };
  walk(laidOut, { x: 0, y: 0 }, undefined);

  const rfEdges: Edge[] = validEdges.map((e) => {
    const s = centers.get(e.source)!;
    const t = centers.get(e.target)!;
    const horizontal = Math.abs(t.x - s.x) >= Math.abs(t.y - s.y);
    const [sourceHandle, targetHandle] = horizontal
      ? t.x >= s.x
        ? ['s-right', 't-left']
        : ['s-left', 't-right']
      : t.y >= s.y
        ? ['s-bottom', 't-top']
        : ['s-top', 't-bottom'];

    const dotted = e.kind === 'dotted' || e.kind === 'dotted-arrow';
    const arrowEnd = e.kind === 'arrow' || e.kind === 'dotted-arrow' || e.kind === 'bidirectional';
    const marker = { type: MarkerType.ArrowClosed, width: 14, height: 14, color: EDGE_COLOR };

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle,
      targetHandle,
      type: 'smoothstep',
      pathOptions: { borderRadius: 14 },
      label: e.label,
      style: {
        stroke: EDGE_COLOR,
        strokeWidth: 1.5,
        strokeOpacity: 0.55,
        ...(dotted ? { strokeDasharray: '5 5' } : {}),
      },
      ...(arrowEnd ? { markerEnd: marker } : {}),
      ...(e.kind === 'bidirectional' ? { markerStart: marker } : {}),
      labelStyle: { fontFamily: 'var(--font-mono)', fontSize: 10.5, fill: '#6B7280' },
      labelBgStyle: { fill: '#F6F7F8', fillOpacity: 0.95 },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 6,
    };
  });

  return { nodes: rfNodes, edges: rfEdges };
}
