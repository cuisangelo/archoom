declare module 'elkjs/lib/elk.bundled.js' {
  export interface ElkNode {
    id: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    children?: ElkNode[];
    edges?: ElkExtendedEdge[];
    layoutOptions?: Record<string, string>;
  }

  export interface ElkExtendedEdge {
    id: string;
    sources: string[];
    targets: string[];
  }

  export default class ELK {
    constructor(options?: Record<string, unknown>);
    layout(graph: ElkNode, options?: Record<string, unknown>): Promise<ElkNode>;
  }
}
