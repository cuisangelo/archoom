export type ArrowKind = 'arrow' | 'bidirectional' | 'line' | 'dotted' | 'dotted-arrow';

export type Direction = 'right' | 'left' | 'down' | 'up';

export interface NodeDef {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  parent?: string;
  isGroup: boolean;
  children: string[];
  /** Created implicitly by appearing in a connection; an explicit definition may still upgrade it. */
  implicit: boolean;
}

export interface EdgeDef {
  id: string;
  source: string;
  target: string;
  kind: ArrowKind;
  label?: string;
}

export interface ParseError {
  line: number;
  message: string;
}

export interface Doc {
  title?: string;
  direction: Direction;
  nodes: Map<string, NodeDef>;
  rootIds: string[];
  edges: EdgeDef[];
  notes: Map<string, string>;
  errors: ParseError[];
}
