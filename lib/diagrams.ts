import fs from 'node:fs';
import path from 'node:path';

export interface DiagramMeta {
  slug: string;
  file: string;
  title?: string;
  description?: string;
}

export interface Diagram extends DiagramMeta {
  source: string;
}

const DIR = path.join(process.cwd(), 'diagrams');
const EXTS = ['.md', '.yaml', '.yml'];

function fileFor(slug: string): string | null {
  if (!/^[\w-]+$/.test(slug)) return null;
  for (const ext of EXTS) {
    const file = path.join(DIR, slug + ext);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

function parseFrontmatter(content: string): { meta: Record<string, string>; bodyStart: number } {
  if (!content.startsWith('---\n')) return { meta: {}, bodyStart: 0 };
  const end = content.indexOf('\n---', 4);
  if (end < 0) return { meta: {}, bodyStart: 0 };
  const meta: Record<string, string> = {};
  for (const line of content.slice(4, end).split('\n')) {
    const ci = line.indexOf(':');
    if (ci < 0) continue;
    const key = line.slice(0, ci).trim();
    const value = line
      .slice(ci + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (key) meta[key] = value;
  }
  const bodyStart = content.indexOf('\n', end + 4);
  return { meta, bodyStart: bodyStart < 0 ? content.length : bodyStart + 1 };
}

interface SourceRegion {
  start: number;
  end: number;
  indent: string;
}

const MD_FENCE = /^```[^\n]*\n/m;

/** Locate the DSL inside the file: a fenced block in .md, a `source: |` block scalar in .yaml. */
function findRegion(file: string, content: string): SourceRegion | null {
  if (file.endsWith('.md')) {
    const { bodyStart } = parseFrontmatter(content);
    const body = content.slice(bodyStart);
    const open = MD_FENCE.exec(body);
    if (open) {
      const start = bodyStart + open.index + open[0].length;
      const close = content.indexOf('\n```', start - 1);
      if (close < 0) return null;
      return { start, end: close + 1, indent: '' };
    }
    // No fenced block: the whole body after the frontmatter is the DSL.
    return { start: bodyStart, end: content.length, indent: '' };
  }

  const m = /^source:\s*\|[-+]?[ \t]*\n/m.exec(content);
  if (!m) return null;
  const start = m.index + m[0].length;
  let end = start;
  while (end < content.length) {
    const lineEnd = content.indexOf('\n', end);
    const stop = lineEnd < 0 ? content.length : lineEnd + 1;
    const line = content.slice(end, stop);
    if (line.trim() !== '' && !/^[ \t]/.test(line)) break;
    end = stop;
  }
  return { start, end, indent: '  ' };
}

function extractSource(content: string, region: SourceRegion): string {
  const raw = content.slice(region.start, region.end);
  if (!region.indent) return raw.replace(/\n$/, '');
  return raw
    .split('\n')
    .map((l) => (l.startsWith(region.indent) ? l.slice(region.indent.length) : l))
    .join('\n')
    .replace(/\n$/, '');
}

export function listDiagrams(): Diagram[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => EXTS.includes(path.extname(f)))
    .sort()
    .map((f) => readDiagram(path.basename(f, path.extname(f))))
    .filter((d): d is Diagram => d !== null);
}

export function readDiagram(slug: string): Diagram | null {
  const file = fileFor(slug);
  if (!file) return null;
  const content = fs.readFileSync(file, 'utf8');
  const region = findRegion(file, content);
  const source = region ? extractSource(content, region) : '';

  let title: string | undefined;
  let description: string | undefined;
  if (file.endsWith('.md')) {
    const { meta } = parseFrontmatter(content);
    title = meta.title;
    description = meta.description;
  } else {
    title = /^title:\s*(.+)$/m.exec(content)?.[1].trim().replace(/^["']|["']$/g, '');
    description = /^description:\s*(.+)$/m.exec(content)?.[1].trim().replace(/^["']|["']$/g, '');
  }

  return { slug, file: path.basename(file), title, description, source };
}

/** Replace only the DSL region of the file, preserving everything around it. */
export function writeDiagramSource(slug: string, source: string): void {
  const file = fileFor(slug);
  if (!file) throw new Error(`No diagram file for "${slug}"`);
  const content = fs.readFileSync(file, 'utf8');
  const region = findRegion(file, content);
  if (!region) throw new Error(`Could not locate the diagram source region in ${path.basename(file)}`);
  const body = region.indent
    ? source
        .split('\n')
        .map((l) => (l.trim() === '' ? '' : region.indent + l))
        .join('\n')
    : source;
  const next = content.slice(0, region.start) + body + '\n' + content.slice(region.end);
  fs.writeFileSync(file, next, 'utf8');
}
