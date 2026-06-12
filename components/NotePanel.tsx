import { X } from 'lucide-react';
import type { NodeDef } from '@/lib/dsl/types';
import { cloudIconSrc } from '@/lib/icons';
import { resolveColor } from '@/lib/colors';
import NodeIcon from './NodeIcon';

interface Props {
  node: NodeDef;
  note: string;
  position: { left: number; top: number };
  onChange: (text: string) => void;
  onClose: () => void;
}

export default function NotePanel({ node, note, position, onChange, onClose }: Props) {
  const tint = resolveColor(node.color);
  const isCloud = cloudIconSrc(node.icon) !== null;

  return (
    <aside
      style={position}
      className="absolute z-10 flex w-80 flex-col gap-3 rounded-3xl border border-white/70 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_48px_rgba(31,36,48,0.16)] backdrop-blur-2xl backdrop-saturate-150"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px]"
          style={{
            backgroundColor: isCloud ? 'rgba(255,255,255,0.85)' : tint.chipBg,
            color: tint.fg,
          }}
        >
          <NodeIcon name={node.icon} hint={node.label} size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-ink">{node.label}</div>
          <div className="truncate font-mono text-[11px] text-muted">{node.id}</div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-muted transition-colors hover:bg-ink/5"
          aria-label="Close note panel"
        >
          <X size={14} />
        </button>
      </div>
      <textarea
        value={note}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write a note about this component…"
        autoFocus
        className="min-h-44 resize-y rounded-xl bg-ink/5 p-3 text-[13px] leading-relaxed text-ink outline-none placeholder:text-muted/70"
      />
      <p className="font-mono text-[10.5px] leading-snug text-muted">
        {note
          ? `saved in the source as  note ${node.id}: "…"`
          : 'Notes are saved into the source file — they travel with the diagram.'}
      </p>
    </aside>
  );
}
