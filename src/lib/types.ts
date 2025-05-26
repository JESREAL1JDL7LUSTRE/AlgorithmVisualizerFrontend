// Types for our API
export interface Edge {
  source: number;
  target: number;
  capacity: number;
  flow: number;
  isExamining?: boolean;  // Track edges being examined during DFS
  isExamined?: boolean;   // Track edges that have been examined
  id?: string;
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
  parallelPaths: number[][];  // Add this to track multiple paths in parallel
  rejectedPaths: number[][];  // Add this
  lastRejectedNode: number | null;  // Add this
  bfsCurrentNode: number | null;  // Track the current BFS node
  bfsCurrentNodes: number[];  // Track multiple BFS nodes for parallel processing
  bfsFrontier: number[][];   // Track BFS frontiers for visualization
  dfsCurrentNode: number | null;  // Track the current DFS node
  dfsCurrentNodes: number[];  // Track multiple DFS nodes for parallel paths
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