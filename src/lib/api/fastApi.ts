import { create } from 'zustand';
import { AlgorithmConfig, GraphState } from '../types';

// Store to manage our graph state
export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  maxFlow: 0,
  currentFlow: 0,
  iteration: 0,
  isRunning: false,
  inBFS: false,
  inDFS: false,
  visitedNodes: new Set<number>(),
  currentPath: [],
  parallelPaths: [], // Add array to store multiple parallel paths
  algorithm: 'improveAlgorithm',
  graphType: 'custom',
  source: 0,
  sink: 0,
  speed: 1.0,
  rejectedPaths: [],
  lastRejectedNode: null,
  bfsCurrentNode: null,  // Initialize bfsCurrentNode
  bfsCurrentNodes: [],   // Initialize array to track multiple BFS nodes
  bfsFrontier: [],       // Initialize BFS frontier tracking
  dfsCurrentNode: null,  // Add explicit tracking for DFS current node
  dfsCurrentNodes: []    // Add array to track multiple DFS nodes
}));

// WebSocket connection and handlers
export class FlowAlgorithmService {
  private static instance: FlowAlgorithmService;
  private ws: WebSocket | null = null;
  private baseUrl: string = 'http://localhost:8000';
  private wsUrl: string = 'ws://localhost:8000/ws';
  
  private constructor() {}
  
  public static getInstance(): FlowAlgorithmService {
    if (!FlowAlgorithmService.instance) {
      FlowAlgorithmService.instance = new FlowAlgorithmService();
    }
    
    return FlowAlgorithmService.instance;
  }
  
  public connect(): void {
    if (this.ws) {
      this.disconnect();
    }
    
    this.ws = new WebSocket(this.wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      
      // Update store when connection closes
      useGraphStore.setState({
        isRunning: false
      });
    };
  }
  
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
  
  private handleMessage(data: any): void {
    if (!this.ws) return;
    
    // Log all incoming messages for debugging
    console.log('WebSocket message received:', data);
    
    switch (data.type) {
      case 'init':
        // Initialize graph with nodes and edges
        useGraphStore.setState({
          nodes: data.nodes,
          edges: data.edges.map((e: any) => ({
            ...e,
            id: `${e.source}-${e.target}`
          })),
          visitedNodes: new Set<number>(),
          currentPath: [],
          parallelPaths: [], // Initialize empty parallel paths
          currentFlow: 0,
          iteration: 0,
          isRunning: true,
          dfsCurrentNodes: [], // Initialize empty array of current DFS nodes
          bfsCurrentNodes: [], // Initialize empty array of current BFS nodes
          bfsFrontier: []      // Initialize empty BFS frontier
        });
        break;
        
      case 'node_visited':
        useGraphStore.setState(state => {
          // Add to visited nodes set
          const updatedVisitedNodes = new Set([...state.visitedNodes, data.node_id]);
          
          // Handle BFS mode updates
          if (state.inBFS) {
            // Update the current BFS node
            const currentNode = data.node_id;
            
            // Check if this node is already in the current BFS nodes
            const nodeExists = state.bfsCurrentNodes.includes(currentNode);
            
            // Add to bfsCurrentNodes if not already there
            const updatedBfsCurrentNodes = nodeExists ? 
              state.bfsCurrentNodes : 
              [...state.bfsCurrentNodes, currentNode];
              
            console.log("BFS visit, setting current nodes to:", updatedBfsCurrentNodes);
            
            return {
              visitedNodes: updatedVisitedNodes,
              bfsCurrentNode: currentNode,  // Keep single node for compatibility
              bfsCurrentNodes: updatedBfsCurrentNodes,
              inBFS: true
            };
          }
          
          // If not in BFS mode, just update visited nodes
          return {
            visitedNodes: updatedVisitedNodes
          };
        });
        break;
        
      case 'edge_explored':
        useGraphStore.setState(state => ({
          edges: state.edges.map(edge => 
            edge.source === data.source && edge.target === data.target
              ? { ...edge, flow: data.flow }
              : edge
          )
        }));
        break;
        
      case 'edge_examined':
        useGraphStore.setState(state => ({
          edges: state.edges.map(edge => {
            // Mark the specific edge as examining
            if (edge.source === data.source && edge.target === data.target) {
              return { ...edge, flow: data.flow, isExamining: true, isExamined: true };
            }
            // Turn off isExamining flag for other edges
            return { ...edge, isExamining: false };
          }),
          // Always set the target node as the current DFS node when an edge is examined
          dfsCurrentNode: data.target,
          inDFS: true // Make sure DFS mode is enabled
        }));
        console.log("Edge examined, highlighting target node:", data.target);
        break;
        
      case 'edge_updated':
        useGraphStore.setState(state => ({
          edges: state.edges.map(edge => 
            edge.source === data.source && edge.target === data.target
              ? { ...edge, flow: data.flow, isExamining: false }
              : edge
          )
        }));
        break;
        
      case 'bfs_start':
        useGraphStore.setState({
          inBFS: true,
          inDFS: false,
          currentPath: [],
          bfsCurrentNode: null, // Reset BFS current node
          bfsCurrentNodes: [], // Reset BFS current nodes array
          bfsFrontier: [],    // Reset BFS frontier
          dfsCurrentNode: null  // Clear DFS current node
        });
        console.log("BFS started");
        break;
        
      case 'bfs_complete':
        // Keep BFS state for visualization similar to DFS
        console.log("BFS completed, preserving visualization");
        break;
        
      case 'bfs_frontier':
        // Handle BFS frontier updates for parallel visualization
        if (data.frontier && Array.isArray(data.frontier)) {
          useGraphStore.setState(state => {
            // Update the BFS frontier
            const updatedFrontier = [...state.bfsFrontier];
            
            // Add the new frontier if it's not empty
            if (data.frontier.length > 0) {
              updatedFrontier.push(data.frontier);
              
              // Limit the number of frontiers we track to avoid memory issues
              if (updatedFrontier.length > 10) {
                updatedFrontier.shift(); // Remove oldest frontier
              }
            }
            
            // Update the current BFS nodes
            return {
              bfsFrontier: updatedFrontier,
              bfsCurrentNodes: data.frontier,
              inBFS: true
            };
          });
          console.log("BFS frontier updated:", data.frontier);
        }
        break;
        
      case 'dfs_start':
        useGraphStore.setState({
          inDFS: true,
          inBFS: false,
          bfsCurrentNode: null, // Clear BFS current node
          bfsCurrentNodes: [], // Clear BFS current nodes
          bfsFrontier: [],    // Clear BFS frontier
          dfsCurrentNode: null, // Initialize DFS current node as null
          dfsCurrentNodes: [], // Initialize empty array of current DFS nodes
          // Make sure to keep an empty path at start
          currentPath: [],
          parallelPaths: [] // Clear parallel paths
        });
        console.log("DFS started");
        break;
        
      case 'dfs_complete':
        // We want to keep the DFS state for visualization
        // Just add a small dummy state update to prevent the linter error
        useGraphStore.setState(state => ({
          inDFS: state.inDFS // Keep inDFS flag as is
          // Do not clear dfsCurrentNode to maintain the highlight
        }));
        console.log("DFS completed, preserving current node and visualization");
        break;
        
      case 'dfs_visit':
        // Extract the current node (last in the path)
        const currentPath = data.current_path || [];
        const currentNode = data.node_id; // Use node_id directly if available
        
        useGraphStore.setState(state => {
          // Check if this path is already tracked
          const pathExists = state.parallelPaths.some(
            path => path.length > 0 && path[path.length - 1] === currentNode
          );
          
          // If this is a new path, add it to parallel paths
          const updatedParallelPaths = pathExists ? 
            state.parallelPaths : 
            [...state.parallelPaths, currentPath];
            
          // Update the current DFS nodes array
          const updatedDfsCurrentNodes = state.dfsCurrentNodes.includes(currentNode) ?
            state.dfsCurrentNodes :
            [...state.dfsCurrentNodes, currentNode];
            
          return {
            inDFS: true,
            currentPath: currentPath, // Keep the most recent path as current
            parallelPaths: updatedParallelPaths,
            dfsCurrentNode: currentNode, // Keep tracking single current node for compatibility
            dfsCurrentNodes: updatedDfsCurrentNodes // Track multiple current nodes
          };
        });
        console.log("DFS visit node:", currentNode, "Path:", currentPath);
        break;
        
      case 'path_found':
        const foundPath = data.path || [];
        const lastNode = foundPath.length > 0 ? foundPath[foundPath.length - 1] : null;
        
        useGraphStore.setState(state => {
          // Add this path to parallel paths if not already there
          const pathExists = state.parallelPaths.some(
            path => path.length > 0 && 
            path.length === foundPath.length && 
            path.every((node, i) => node === foundPath[i])
          );
          
          const updatedParallelPaths = pathExists ?
            state.parallelPaths :
            [...state.parallelPaths, foundPath];
            
          return {
            currentPath: foundPath,
            parallelPaths: updatedParallelPaths,
            dfsCurrentNode: lastNode // Set the last node in the path as current
          };
        });
        console.log("Path found, setting current node to:", lastNode);
        break;
        
      case 'iteration_start':
        useGraphStore.setState({
          iteration: data.iteration,
          visitedNodes: new Set<number>(),
          currentPath: [],
          parallelPaths: [], // Clear parallel paths on new iteration
          dfsCurrentNodes: [], // Clear current DFS nodes on new iteration
          bfsCurrentNodes: [], // Clear current BFS nodes on new iteration
          bfsFrontier: []     // Clear BFS frontier on new iteration
        });
        break;
        
      case 'flow_update':
        useGraphStore.setState({
          currentFlow: data.current_flow
        });
        break;
        
      case 'algorithm_complete':
      case 'algorithm_stopped':  // Add handling for explicit stop messages
        useGraphStore.setState(state => {
          const lastNodeInPath = state.currentPath.length > 0 ? 
            state.currentPath[state.currentPath.length - 1] : null;
          
          return {
            maxFlow: data.max_flow || data.current_flow || 0,
            isRunning: false,
            // Keep inDFS true to maintain visualization
            // inBFS: false,
            // inDFS: false,
            // Set dfsCurrentNode to the last node in the path if not already set
            dfsCurrentNode: state.dfsCurrentNode || lastNodeInPath,
            bfsCurrentNode: null // Clear BFS current node
          };
        });
        console.log("Algorithm completed, preserving visualization state");
        break;
        
      case 'ready':
        useGraphStore.setState({
          source: data.source,
          sink: data.sink
        });
        break;
        
      case 'path_rejected':
        useGraphStore.setState(state => ({
          rejectedPaths: [...state.rejectedPaths, data.rejected_path || []],
          lastRejectedNode: data.last_node,
          dfsCurrentNode: data.last_node // Set the rejection node as current
        }));
        console.log("Path rejected, setting current node to:", data.last_node);
        break;
        
      case 'backtrack':
        useGraphStore.setState(state => ({
          rejectedPaths: [...state.rejectedPaths, data.dead_end_path || []],
          lastRejectedNode: data.node_id,
          dfsCurrentNode: data.node_id // Set the backtracking node as current
        }));
        console.log("Backtracking, setting current node to:", data.node_id);
        break;
        
      case 'error':
        console.error('Algorithm error:', data.message);
        // Always ensure we update the running state on errors
        useGraphStore.setState({
          isRunning: false,
          inBFS: false,
          inDFS: false,
          bfsCurrentNode: null // Clear BFS current node
        });
        break;
        
      default:
        console.log('Unhandled message type:', data.type);
    }
  }
  
  public async startAlgorithm(config: AlgorithmConfig): Promise<void> {
    try {
      console.log('Starting algorithm with config:', config);
      
      if (!this.isConnected()) {
        console.log('WebSocket not connected, attempting to connect...');
        this.connect();
      }
      
      // Ensure speed is a number and properly formatted
      const safeConfig = {
        ...config,
        speed: parseFloat(config.speed.toFixed(1)) // Ensure it's a properly formatted number
      };
      
      const response = await fetch(`${this.baseUrl}/start-algorithm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(safeConfig)
      });
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (!response.ok) {
        throw new Error(`Failed to start algorithm: ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      console.log('Algorithm started:', data);
      
      useGraphStore.setState({
        isRunning: true,
        visitedNodes: new Set<number>(),
        currentPath: [],
        source: config.source,
        sink: config.sink || 0,
        algorithm: config.algorithm,
        graphType: config.graph_type,
        speed: config.speed,
        bfsCurrentNode: null  // Reset BFS current node
      });
      
    } catch (error) {
      console.error('Error starting algorithm:', error);
      useGraphStore.setState({
        isRunning: false
      });
      throw error;
    }
  }
  
  public async stopAlgorithm(): Promise<void> {
    try {
      // Only use WebSocket for stopping
      if (this.isConnected()) {
        this.sendMessage({ command: "stop" });
        
        // Set a timeout to force state reset if we don't get a response
        setTimeout(() => {
          useGraphStore.setState({
            isRunning: false,
            // Keep inDFS and inBFS states for visualization
            // inBFS: false,
            // inDFS: false,
            bfsCurrentNode: null
          });
        }, 1000); // Force reset after 1 second if no response
      } else {
        // If WebSocket is not connected, try to reconnect and send stop
        this.connect();
        setTimeout(() => {
          if (this.isConnected()) {
            this.sendMessage({ command: "stop" });
          }
          // Force state reset
          useGraphStore.setState({
            isRunning: false,
            // Keep inDFS and inBFS states for visualization
            // inBFS: false,
            // inDFS: false,
            bfsCurrentNode: null
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error stopping algorithm:', error);
      // Even if there's an error, we should still update the UI state
      useGraphStore.setState({
        isRunning: false,
        // Keep inDFS and inBFS states for visualization
        // inBFS: false,
        // inDFS: false,
        bfsCurrentNode: null
      });
    }
  }
  
  public sendMessage(message: any): void {
    if (this.isConnected()) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

export const algorithmService = FlowAlgorithmService.getInstance();