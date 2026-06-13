export interface Pt {
  x: number;
  y: number;
}

/** A point on an edge's polyline where it hops over a crossing edge. `seg` is the index of the
 *  polyline segment (points[seg] → points[seg+1]) the hop sits on. */
export interface Jump {
  seg: number;
  x: number;
  y: number;
}

/** Treat a segment as axis-aligned when its off-axis delta is below this (px). */
const EPS = 1.2;

/** Detect right-angle crossings between edges. At each H×V crossing the horizontal segment is the
 *  one that hops, so a crossing is marked on exactly one edge — never both. */
export function computeJumps(edges: { id: string; points: Pt[] }[]): Map<string, Jump[]> {
  type Seg = { id: string; seg: number; ax: number; ay: number; bx: number; by: number; horiz: boolean };
  const segs: Seg[] = [];
  for (const e of edges) {
    for (let i = 0; i < e.points.length - 1; i++) {
      const a = e.points[i];
      const b = e.points[i + 1];
      const horiz = Math.abs(a.y - b.y) <= EPS;
      const vert = Math.abs(a.x - b.x) <= EPS;
      if (horiz === vert) continue; // skip diagonals and zero-length segments
      segs.push({ id: e.id, seg: i, ax: a.x, ay: a.y, bx: b.x, by: b.y, horiz });
    }
  }

  const result = new Map<string, Jump[]>();
  const margin = 8; // keep hops clear of corners and endpoints
  for (const h of segs) {
    if (!h.horiz) continue;
    const hy = h.ay;
    const hMin = Math.min(h.ax, h.bx);
    const hMax = Math.max(h.ax, h.bx);
    for (const v of segs) {
      if (v.horiz || v.id === h.id) continue;
      const vx = v.ax;
      const vMin = Math.min(v.ay, v.by);
      const vMax = Math.max(v.ay, v.by);
      if (vx > hMin + margin && vx < hMax - margin && hy > vMin + margin && hy < vMax - margin) {
        const list = result.get(h.id) ?? [];
        list.push({ seg: h.seg, x: vx, y: hy });
        result.set(h.id, list);
      }
    }
  }
  return result;
}

/** Build an SVG path from an orthogonal polyline: rounds corners and draws a small arc "hop" at
 *  every crossing where this edge passes over another. */
export function buildEdgePath(points: Pt[], jumps: Jump[], r = 8, jr = 5.5): string {
  if (points.length < 2) return '';
  const n = points.length;
  const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

  // Trim each segment back from its corners so the gaps can be bridged with rounded arcs.
  const seg = points.slice(0, -1).map((a, i) => {
    const b = points[i + 1];
    const len = dist(a, b);
    const rin = i > 0 ? Math.min(r, len / 2, dist(points[i - 1], a) / 2) : 0;
    const rout = i < n - 2 ? Math.min(r, len / 2, dist(b, points[i + 2]) / 2) : 0;
    return { a, b, sp: lerp(a, b, rin / len), ep: lerp(a, b, (len - rout) / len) };
  });

  const f = (v: number) => v.toFixed(2);
  let d = `M ${f(seg[0].sp.x)} ${f(seg[0].sp.y)}`;
  for (let i = 0; i < seg.length; i++) {
    const s = seg[i];
    const horiz = Math.abs(s.b.y - s.a.y) <= EPS;
    if (horiz) {
      const dir = Math.sign(s.ep.x - s.sp.x) || 1;
      const y = s.sp.y;
      const hops = jumps
        .filter((j) => j.seg === i && (j.x - s.sp.x) * dir > jr && (s.ep.x - j.x) * dir > jr)
        .map((j) => j.x)
        .sort((p, q) => (p - q) * dir);
      const sweep = dir > 0 ? 0 : 1; // bulge upward regardless of travel direction
      for (const jx of hops) {
        d += ` L ${f(jx - dir * jr)} ${f(y)} A ${jr} ${jr} 0 0 ${sweep} ${f(jx + dir * jr)} ${f(y)}`;
      }
    }
    d += ` L ${f(s.ep.x)} ${f(s.ep.y)}`;
    if (i < seg.length - 1) {
      const next = seg[i + 1];
      d += ` Q ${f(s.b.x)} ${f(s.b.y)} ${f(next.sp.x)} ${f(next.sp.y)}`;
    }
  }
  return d;
}

/** Midpoint by arc length — used to anchor the edge label. */
export function pathMidpoint(points: Pt[]): Pt {
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 };
  const lens = points.slice(0, -1).map((a, i) => Math.hypot(points[i + 1].x - a.x, points[i + 1].y - a.y));
  let half = lens.reduce((s, l) => s + l, 0) / 2;
  for (let i = 0; i < lens.length; i++) {
    if (half <= lens[i]) {
      const t = lens[i] === 0 ? 0 : half / lens[i];
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      };
    }
    half -= lens[i];
  }
  return points[points.length - 1];
}
