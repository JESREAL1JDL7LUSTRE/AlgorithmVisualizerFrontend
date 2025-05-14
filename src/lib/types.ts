// Types for our API
export interface Edge {
    source: number;
    target: number;
    capacity: number;
    flow: number;
  }
  
  export interface Node {
    id: number;
    x: number;
    y: number;
    label?: string;
  }
  
  export interface GraphState {
    nodes: Node[];
    edges: Edge[];
    maxFlow: number;
    currentFlow: number;
    iteration: number;
    isRunning: boolean;
    inBFS: boolean;
    inDFS: boolean;
    visitedNodes: Set<number>;
    currentPath: number[];
    algorithm: string;
    graphType: string;
    source: number;
    sink: number;
    speed: number;
  }
  
  export interface AlgorithmConfig {
    source: number;
    sink?: number;
    algorithm: string;
    graph_type: string;
    graph_file: string;
    speed: number;
  }