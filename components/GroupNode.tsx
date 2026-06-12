import type { NodeProps } from '@xyflow/react';
import { resolveColor } from '@/lib/colors';
import NodeIcon from './NodeIcon';
import NodeHandles from './NodeHandles';

export default function GroupNode({ data, selected }: NodeProps) {
  const d = data as { label: string; icon?: string; color?: string; hasNote?: boolean };
  const tint = resolveColor(d.color);

  return (
    <div
      className="h-full w-full rounded-3xl border transition-colors"
      style={{
        backgroundColor: tint.groupBg,
        borderColor: selected ? '#2B2F3A' : tint.groupBorder,
        backdropFilter: 'blur(6px) saturate(150%)',
        WebkitBackdropFilter: 'blur(6px) saturate(150%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
      }}
    >
      <div
        className="flex items-center gap-1.5 px-4 pt-3.5"
        style={{ color: d.color ? tint.fg : '#6B7280' }}
      >
        {d.icon && <NodeIcon name={d.icon} size={13} strokeWidth={1.9} />}
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em]">{d.label}</span>
        {d.hasNote && <span className="ml-1 h-2 w-2 rounded-full bg-current opacity-70" />}
      </div>
      <NodeHandles />
    </div>
  );
}
