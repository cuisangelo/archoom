import type { NodeProps } from '@xyflow/react';
import { cloudIconSrc } from '@/lib/icons';
import { resolveColor } from '@/lib/colors';
import NodeIcon from './NodeIcon';
import NodeHandles from './NodeHandles';

export default function ArchNode({ data, selected }: NodeProps) {
  const d = data as { label: string; icon?: string; color?: string; hasNote?: boolean };
  const tint = resolveColor(d.color);
  const isCloud = cloudIconSrc(d.icon) !== null;

  return (
    <div
      className={`relative flex h-full w-full items-center gap-2.5 rounded-2xl border bg-white/90 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_6px_16px_rgba(31,36,48,0.07)] transition-colors ${
        selected ? 'border-primary/70 ring-2 ring-primary/15' : 'border-white/70 ring-1 ring-ink/5'
      }`}
    >
      <span
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]"
        style={{
          backgroundColor: isCloud ? 'rgba(255,255,255,0.85)' : tint.chipBg,
          color: tint.fg,
        }}
      >
        <NodeIcon name={d.icon} hint={d.label} size={16} />
      </span>
      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium text-ink">
        {d.label}
      </span>
      {d.hasNote && (
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary" />
      )}
      <NodeHandles />
    </div>
  );
}
