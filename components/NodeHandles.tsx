import { Fragment } from 'react';
import { Handle, Position } from '@xyflow/react';

const HIDDEN = {
  opacity: 0,
  pointerEvents: 'none',
  width: 2,
  height: 2,
  minWidth: 0,
  minHeight: 0,
  border: 'none',
} as const;

const SIDES: Array<[Position, string]> = [
  [Position.Top, 'top'],
  [Position.Right, 'right'],
  [Position.Bottom, 'bottom'],
  [Position.Left, 'left'],
];

/** Invisible source/target handles on all four sides so edges can attach anywhere. */
export default function NodeHandles() {
  return (
    <>
      {SIDES.map(([position, name]) => (
        <Fragment key={name}>
          <Handle type="source" position={position} id={`s-${name}`} isConnectable={false} style={HIDDEN} />
          <Handle type="target" position={position} id={`t-${name}`} isConnectable={false} style={HIDDEN} />
        </Fragment>
      ))}
    </>
  );
}
