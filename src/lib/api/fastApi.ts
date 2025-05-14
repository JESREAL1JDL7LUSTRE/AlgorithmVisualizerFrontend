// src/lib/fastApi.ts
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
        useGraphStore.setState({
          isRunning: false
        });
        break;
        
      default:
        console.log('Unhandled message type:', data.type);
    }
  }
  
  public async startAlgorithm(config: AlgorithmConfig): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/start-algorithm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) {
        throw new Error('Failed to start algorithm');
      }
      
      const data = await response.json();
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
    }
  }
  
  public async stopAlgorithm(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/stop-algorithm`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to stop algorithm');
      }
      
      useGraphStore.setState({
        isRunning: false,
        inBFS: false,
        inDFS: false
      });
      
    } catch (error) {
      console.error('Error stopping algorithm:', error);
    }
  }
  
  public sendMessage(message: any): void {
    if (this.isConnected()) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

export const algorithmService = FlowAlgorithmService.getInstance();