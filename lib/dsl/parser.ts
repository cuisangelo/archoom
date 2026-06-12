import type { ArrowKind, Doc, NodeDef, ParseError } from './types';

export function unquote(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
    try {
      return JSON.parse(t) as string;
    } catch {
      return t.slice(1, -1);
    }
  }
  return t;
}

function stripComment(line: string): string {
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line[i - 1] !== '\\') inQuote = !inQuote;
    else if (!inQuote && c === '/' && line[i + 1] === '/') return line.slice(0, i);
  }
  return line;
}

/** Split on a separator that sits outside quotes and outside [...] brackets. */
function splitTop(s: string, sep: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let inQuote = false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' && s[i - 1] !== '\\') inQuote = !inQuote;
    else if (!inQuote) {
      if (c === '[') depth++;
      else if (c === ']') depth = Math.max(0, depth - 1);
      else if (c === sep && depth === 0) {
        parts.push(cur);
        cur = '';
        continue;
      }
    }
    cur += c;
  }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter((p) => p !== '');
}

function topLevelColon(s: string): number {
  let inQuote = false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' && s[i - 1] !== '\\') inQuote = !inQuote;
    else if (!inQuote) {
      if (c === '[') depth++;
      else if (c === ']') depth = Math.max(0, depth - 1);
      else if (c === ':' && depth === 0) return i;
    }
  }
  return -1;
}

interface ArrowHit {
  index: number;
  len: number;
  kind: ArrowKind;
  swap: boolean;
}

function findArrows(line: string): ArrowHit[] {
  const hits: ArrowHit[] = [];
  let inQuote = false;
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line[i - 1] !== '\\') {
      inQuote = !inQuote;
      continue;
    }
    if (inQuote) continue;
    if (c === '[') {
      depth++;
      continue;
    }
    if (c === ']') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth > 0) continue;
    const prevWs = i === 0 || /\s/.test(line[i - 1]);
    const nextWs = (at: number) => at >= line.length || /\s/.test(line[at]);
    if (c === '<' && line[i + 1] === '>') {
      hits.push({ index: i, len: 2, kind: 'bidirectional', swap: false });
      i += 1;
    } else if (c === '-' && line[i + 1] === '-' && line[i + 2] === '>') {
      hits.push({ index: i, len: 3, kind: 'dotted-arrow', swap: false });
      i += 2;
    } else if (c === '-' && line[i + 1] === '-' && prevWs && nextWs(i + 2)) {
      hits.push({ index: i, len: 2, kind: 'dotted', swap: false });
      i += 1;
    } else if (c === '>') {
      hits.push({ index: i, len: 1, kind: 'arrow', swap: false });
    } else if (c === '<') {
      hits.push({ index: i, len: 1, kind: 'arrow', swap: true });
    } else if (c === '-' && prevWs && nextWs(i + 1)) {
      hits.push({ index: i, len: 1, kind: 'line', swap: false });
    }
  }
  return hits;
}

function parseProps(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of splitTop(s, ',')) {
    const ci = part.indexOf(':');
    if (ci < 0) continue;
    const key = part.slice(0, ci).trim().toLowerCase();
    const value = unquote(part.slice(ci + 1));
    if (key) out[key] = value;
  }
  return out;
}

function parseHead(
  s: string,
  line: number,
  errors: ParseError[],
): { name: string; props: Record<string, string> } | null {
  let name = s;
  let props: Record<string, string> = {};
  let inQuote = false;
  let bracketAt = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' && s[i - 1] !== '\\') inQuote = !inQuote;
    else if (!inQuote && c === '[') {
      bracketAt = i;
      break;
    }
  }
  if (bracketAt >= 0) {
    const close = s.lastIndexOf(']');
    if (close < bracketAt) {
      errors.push({ line, message: 'Missing "]"' });
      return null;
    }
    props = parseProps(s.slice(bracketAt + 1, close));
    name = s.slice(0, bracketAt);
  }
  name = unquote(name);
  if (!name) {
    errors.push({ line, message: 'Missing a name' });
    return null;
  }
  return { name, props };
}

const DIRECTIVE_RE = /^(direction|colorMode|styleMode|typeface|title)\s+(.+)$/;

export function parse(source: string): Doc {
  const doc: Doc = {
    direction: 'right',
    nodes: new Map(),
    rootIds: [],
    edges: [],
    notes: new Map(),
    errors: [],
  };
  const stack: NodeDef[] = [];

  const ensure = (name: string): NodeDef => {
    let n = doc.nodes.get(name);
    if (!n) {
      n = { id: name, label: name, isGroup: false, children: [], implicit: true };
      doc.nodes.set(name, n);
      doc.rootIds.push(name);
    }
    return n;
  };

  const place = (n: NodeDef) => {
    if (n.parent) {
      const prev = doc.nodes.get(n.parent);
      if (prev) prev.children = prev.children.filter((c) => c !== n.id);
    } else {
      doc.rootIds = doc.rootIds.filter((c) => c !== n.id);
    }
    const parent = stack[stack.length - 1];
    if (parent) {
      n.parent = parent.id;
      parent.children.push(n.id);
    } else {
      n.parent = undefined;
      doc.rootIds.push(n.id);
    }
  };

  const lines = source.split('\n');
  lines.forEach((raw, idx) => {
    const ln = idx + 1;
    const line = stripComment(raw).trim();
    if (!line) return;

    if (line === '}') {
      if (!stack.length) doc.errors.push({ line: ln, message: 'Unmatched "}"' });
      else stack.pop();
      return;
    }

    const directive = DIRECTIVE_RE.exec(line);
    if (directive) {
      if (directive[1] === 'direction') {
        const v = directive[2].trim().toLowerCase();
        if (v === 'right' || v === 'left' || v === 'down' || v === 'up') doc.direction = v;
        else doc.errors.push({ line: ln, message: `Unknown direction "${directive[2].trim()}"` });
      } else if (directive[1] === 'title') {
        doc.title = unquote(directive[2]);
      }
      // colorMode / styleMode / typeface are accepted for compatibility and ignored.
      return;
    }

    if (/^note\s/.test(line)) {
      const rest = line.slice(4).trim();
      const ci = topLevelColon(rest);
      if (ci < 0) {
        doc.errors.push({ line: ln, message: 'Expected: note <id>: "text"' });
        return;
      }
      const id = unquote(rest.slice(0, ci));
      const text = unquote(rest.slice(ci + 1));
      if (id) doc.notes.set(id, text);
      return;
    }

    const hits = findArrows(line);
    if (hits.length) {
      const segments: string[] = [];
      let prev = 0;
      for (const h of hits) {
        segments.push(line.slice(prev, h.index));
        prev = h.index + h.len;
      }
      segments.push(line.slice(prev));

      let label: string | undefined;
      const last = segments[segments.length - 1];
      const ci = topLevelColon(last);
      if (ci >= 0) {
        label = unquote(last.slice(ci + 1)) || undefined;
        segments[segments.length - 1] = last.slice(0, ci);
      }

      const endpointGroups = segments.map((seg) =>
        splitTop(seg, ',')
          .map((part) => {
            const head = parseHead(part, ln, doc.errors);
            if (!head) return null;
            const n = ensure(head.name);
            if (head.props.icon) n.icon = head.props.icon;
            if (head.props.color) n.color = head.props.color;
            if (head.props.label) n.label = head.props.label;
            return head.name;
          })
          .filter((x): x is string => x !== null),
      );

      for (let i = 0; i < hits.length; i++) {
        const h = hits[i];
        const from = endpointGroups[i] ?? [];
        const to = endpointGroups[i + 1] ?? [];
        if (!from.length || !to.length) {
          doc.errors.push({ line: ln, message: 'Connection is missing an endpoint' });
          continue;
        }
        for (const a of from) {
          for (const b of to) {
            const [s, t] = h.swap ? [b, a] : [a, b];
            if (s === t) continue;
            doc.edges.push({ id: `e${doc.edges.length}`, source: s, target: t, kind: h.kind, label });
          }
        }
      }
      return;
    }

    const isGroup = /\{\s*$/.test(line);
    const head = parseHead(isGroup ? line.replace(/\{\s*$/, '') : line, ln, doc.errors);
    if (!head) return;

    let n = doc.nodes.get(head.name);
    if (n && !n.implicit) {
      doc.errors.push({ line: ln, message: `"${head.name}" is already defined` });
      return;
    }
    if (!n) {
      n = { id: head.name, label: head.name, isGroup: false, children: [], implicit: false };
      doc.nodes.set(n.id, n);
      doc.rootIds.push(n.id);
    }
    n.implicit = false;
    n.isGroup = n.isGroup || isGroup;
    n.label = head.props.label ?? n.id;
    if (head.props.icon) n.icon = head.props.icon;
    if (head.props.color) n.color = head.props.color;
    place(n);
    if (isGroup) stack.push(n);
  });

  if (stack.length) {
    doc.errors.push({
      line: lines.length,
      message: `Missing "}" — ${stack.length} unclosed group${stack.length > 1 ? 's' : ''}`,
    });
  }

  return doc;
}
