'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  useViewport,
  type Edge,
  type Node,
  type NodeChange,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Editor from './Editor';
import ArchNode from './ArchNode';
import GroupNode from './GroupNode';
import NotePanel from './NotePanel';
import { parse } from '@/lib/dsl/parser';
import { upsertNote } from '@/lib/dsl/notes';
import { layoutDoc } from '@/lib/layout/elk';

const nodeTypes = { archNode: ArchNode, archGroup: GroupNode };

const PANEL_WIDTH = 320;
const PANEL_GAP = 14;

type SaveState = 'saved' | 'saving' | 'error';

interface Props {
  slug: string;
  file: string;
  initialSource: string;
}

function Canvas({ slug, file, initialSource }: Props) {
  const [source, setSource] = useState(initialSource);
  const [showCode, setShowCode] = useState(true);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const canvasRef = useRef<HTMLDivElement>(null);
  const reactFlow = useReactFlow();
  const viewport = useViewport();

  const doc = useMemo(() => parse(source), [source]);
  const docRef = useRef(doc);
  docRef.current = doc;

  // Persist edits back to the diagram file, debounced.
  const lastSaved = useRef(initialSource);
  useEffect(() => {
    if (source === lastSaved.current) return;
    setSaveState('saving');
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/diagrams/${slug}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source }),
        });
        if (!res.ok) throw new Error(await res.text());
        lastSaved.current = source;
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [source, slug]);

  // Only re-run the (async) auto-layout when the structure changes — not on note edits.
  const structKey = useMemo(
    () =>
      JSON.stringify({
        d: doc.direction,
        n: [...doc.nodes.values()].map((n) => [n.id, n.label, n.icon, n.color, n.parent, n.isGroup]),
        e: doc.edges.map((e) => [e.source, e.target, e.kind, e.label]),
      }),
    [doc],
  );

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void layoutDoc(docRef.current).then((result) => {
        if (cancelled) return;
        const notes = docRef.current.notes;
        setNodes(result.nodes.map((n) => ({ ...n, data: { ...n.data, hasNote: notes.has(n.id) } })));
        setEdges(result.edges);
        window.setTimeout(() => void reactFlow.fitView({ padding: 0.12, duration: 500 }), 50);
      });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [structKey, reactFlow]);

  // Re-fit when the editor pane is toggled and the canvas changes size.
  useEffect(() => {
    const timer = window.setTimeout(() => void reactFlow.fitView({ padding: 0.12, duration: 300 }), 50);
    return () => window.clearTimeout(timer);
  }, [showCode, reactFlow]);

  const notesKey = useMemo(() => JSON.stringify([...doc.notes.keys()].sort()), [doc]);
  useEffect(() => {
    setNodes((ns) =>
      ns.map((n) => {
        const hasNote = docRef.current.notes.has(n.id);
        return n.data.hasNote === hasNote ? n : { ...n, data: { ...n.data, hasNote } };
      }),
    );
  }, [notesKey]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((ns) => applyNodeChanges(changes, ns)),
    [],
  );
  const onSelectionChange = useCallback(
    ({ nodes: sel }: OnSelectionChangeParams) => setSelectedId(sel[0]?.id ?? null),
    [],
  );
  const closePanel = useCallback(() => {
    setSelectedId(null);
    setNodes((ns) => ns.map((n) => (n.selected ? { ...n, selected: false } : n)));
  }, []);

  const selected = selectedId ? doc.nodes.get(selectedId) : undefined;

  // Place the note panel right next to the selected node, following pan/zoom/drag.
  const panelPos = useMemo(() => {
    if (!selectedId) return null;
    const internal = reactFlow.getInternalNode(selectedId);
    if (!internal) return null;
    const abs = internal.internals.positionAbsolute;
    const w = internal.measured?.width ?? 160;
    const { x: vx, y: vy, zoom } = viewport;
    const rect = canvasRef.current?.getBoundingClientRect();
    const cw = rect?.width ?? 1200;
    const ch = rect?.height ?? 800;
    let left = (abs.x + w) * zoom + vx + PANEL_GAP;
    if (left + PANEL_WIDTH > cw - 12) left = abs.x * zoom + vx - PANEL_WIDTH - PANEL_GAP;
    left = Math.max(12, Math.min(left, cw - PANEL_WIDTH - 12));
    let top = abs.y * zoom + vy;
    top = Math.max(12, Math.min(top, ch - 320));
    return { left, top };
  }, [selectedId, viewport, nodes, reactFlow]);

  const componentCount = useMemo(() => [...doc.nodes.values()].filter((n) => !n.isGroup).length, [doc]);
  const firstError = doc.errors[0];

  const glassButton =
    'rounded-full border border-white/60 bg-white/50 backdrop-blur-md px-3.5 py-1.5 text-[12px] font-medium text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-white/85 transition-colors';

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-surface font-sans text-ink">
      {/* Soft color washes behind the glass surfaces. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[520px] w-[620px] rounded-full bg-[#7C9CD8]/30 blur-[110px]" />
        <div className="absolute right-[-10%] top-1/3 h-[460px] w-[560px] rounded-full bg-[#9D8BC4]/25 blur-[110px]" />
        <div className="absolute bottom-[-15%] left-[10%] h-[420px] w-[520px] rounded-full bg-[#7FB5AE]/25 blur-[100px]" />
      </div>

      <header className="relative flex h-12 shrink-0 items-center gap-3 border-b border-white/60 bg-white/55 px-4 backdrop-blur-xl backdrop-saturate-150">
        <Link href="/" className="font-mono text-[14px] font-semibold tracking-tight hover:text-muted">
          archoom
        </Link>
        <span className="font-mono text-[12px] text-muted">/ {file}</span>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`font-mono text-[11px] ${saveState === 'error' ? 'text-[#9A4A42]' : 'text-muted'}`}
          >
            {saveState === 'saved' && '✓ saved'}
            {saveState === 'saving' && 'saving…'}
            {saveState === 'error' && 'write failed — read-only?'}
          </span>
          <button onClick={() => setShowCode((v) => !v)} className={`flex items-center gap-1.5 ${glassButton}`}>
            {showCode ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
            {showCode ? 'Hide code' : 'Show code'}
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        {showCode && (
          <div className="flex w-[400px] shrink-0 flex-col border-r border-white/60 bg-white/75 backdrop-blur-xl backdrop-saturate-150">
            <div className="min-h-0 flex-1 overflow-hidden">
              <Editor value={source} onChange={setSource} />
            </div>
            <div className="flex h-9 shrink-0 items-center border-t border-hairline/70 px-3.5 font-mono text-[11px]">
              {firstError ? (
                <span className="truncate text-[#9A4A42]">
                  line {firstError.line}: {firstError.message}
                </span>
              ) : (
                <span className="text-muted">
                  ✓ {componentCount} components · {doc.edges.length} connections
                </span>
              )}
            </div>
          </div>
        )}

        <div ref={canvasRef} className="relative min-w-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onSelectionChange={onSelectionChange}
            nodesConnectable={false}
            deleteKeyCode={null}
            minZoom={0.15}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="#D7DAE0" />
            <Controls position="bottom-right" showInteractive={false} />
          </ReactFlow>
          {doc.title && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/60 bg-white/55 px-3.5 py-1.5 font-mono text-[11px] tracking-[0.05em] text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md">
              {doc.title}
            </div>
          )}
          {selected && panelPos && (
            <NotePanel
              node={selected}
              note={doc.notes.get(selected.id) ?? ''}
              position={panelPos}
              onChange={(text) => setSource((s) => upsertNote(s, selected.id, text))}
              onClose={closePanel}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Workbench(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
