import { BaseEdge, EdgeText, type EdgeProps } from '@xyflow/react';
import { buildEdgePath, pathMidpoint, type Jump, type Pt } from '@/lib/layout/edge-path';

/** Draws an edge along ELK's orthogonal route with rounded corners and arc hops over crossings. */
export default function OrthEdge({
  id,
  data,
  style,
  markerEnd,
  markerStart,
  label,
  labelStyle,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
}: EdgeProps) {
  const d = data as { points?: Pt[]; jumps?: Jump[] } | undefined;
  if (!d?.points || d.points.length < 2) return null;

  const path = buildEdgePath(d.points, d.jumps ?? []);
  const mid = pathMidpoint(d.points);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
        interactionWidth={0}
      />
      {label != null && label !== '' && (
        <EdgeText
          x={mid.x}
          y={mid.y}
          label={label}
          labelStyle={labelStyle}
          labelShowBg
          labelBgStyle={labelBgStyle}
          labelBgPadding={labelBgPadding}
          labelBgBorderRadius={labelBgBorderRadius}
        />
      )}
    </>
  );
}
