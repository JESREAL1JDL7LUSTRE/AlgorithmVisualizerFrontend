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
  algorithm: 'improveAlgorithm',
  graphType: 'custom',
  source: 0,
  sink: 0,
  speed: 1.0,
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
          currentFlow: 0,
          iteration: 0,
          isRunning: true
        });
        break;
        
      case 'node_visited':
        useGraphStore.setState(state => ({
          visitedNodes: new Set([...state.visitedNodes, data.node_id])
        }));
        break;
        
      case 'edge_explored':
      case 'edge_examined':
      case 'edge_updated':
        useGraphStore.setState(state => ({
          edges: state.edges.map(edge => 
            edge.source === data.source && edge.target === data.target
              ? { ...edge, flow: data.flow }
              : edge
          )
        }));
        break;
        
      case 'bfs_start':
        useGraphStore.setState({
          inBFS: true,
          inDFS: false,
          currentPath: []
        });
        break;
        
      case 'bfs_complete':
        useGraphStore.setState({
          inBFS: false
        });
        break;
        
      case 'dfs_start':
        useGraphStore.setState({
          inDFS: true,
          inBFS: false
        });
        break;
        
      case 'dfs_complete':
        useGraphStore.setState({
          inDFS: false,
          currentPath: []
        });
        break;
        
      case 'dfs_visit':
        useGraphStore.setState({
          inDFS: true
        });
        break;
        
      case 'path_found':
        useGraphStore.setState({
          currentPath: data.path || []
        });
        break;
        
      case 'iteration_start':
        useGraphStore.setState({
          iteration: data.iteration,
          visitedNodes: new Set<number>(),
          currentPath: []
        });
        break;
        
      case 'flow_update':
        useGraphStore.setState({
          currentFlow: data.current_flow
        });
        break;
        
      case 'algorithm_complete':
      case 'algorithm_stopped':  // Add handling for explicit stop messages
        useGraphStore.setState({
          maxFlow: data.max_flow || data.current_flow || 0,
          isRunning: false,
          inBFS: false,
          inDFS: false
        });
        break;
        
      case 'ready':
        useGraphStore.setState({
          source: data.source,
          sink: data.sink
        });
        break;
        
      case 'error':
        console.error('Algorithm error:', data.message);
        // Always ensure we update the running state on errors
        useGraphStore.setState({
          isRunning: false,
          inBFS: false,
          inDFS: false
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
        speed: config.speed
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
            inBFS: false,
            inDFS: false
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
            inBFS: false,
            inDFS: false
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error stopping algorithm:', error);
      // Even if there's an error, we should still update the UI state
      useGraphStore.setState({
        isRunning: false,
        inBFS: false,
        inDFS: false
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