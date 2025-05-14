"use client"
import React, { useEffect } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { algorithmService, useGraphStore } from '@/lib/api/fastApi';

// Custom node types
const nodeTypes = {};

// Custom edge types
const edgeTypes = {};

const VisualizingGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const { 
    nodes: graphNodes, 
    edges: graphEdges, 
    visitedNodes,
    currentFlow,
    maxFlow,
    iteration,
    isRunning,
    inBFS,
    inDFS
  } = useGraphStore();
  
  // Transform graph nodes to ReactFlow nodes
  useEffect(() => {
    if (graphNodes.length > 0) {
      const reactFlowNodes = graphNodes.map(node => {
        const isVisited = visitedNodes.has(node.id);
        
        return {
          id: node.id.toString(),
          position: { x: node.x, y: node.y },
          data: { label: `Node ${node.id}` },
          style: {
            background: isVisited 
              ? inBFS 
                ? '#ffcc00' // Yellow for BFS
                : inDFS 
                  ? '#ff9900' // Orange for DFS
                  : '#4dabf7' // Blue for visited
              : '#ffffff', // White for unvisited
            border: '1px solid #1a192b',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '10px',
            color: isVisited && (inBFS || inDFS) ? '#000000' : '#1a192b',
            transition: 'all 0.3s ease'
          }
        };
      });
      
      setNodes(reactFlowNodes);
    }
  }, [graphNodes, visitedNodes, inBFS, inDFS]);
  
  // Transform graph edges to ReactFlow edges
  useEffect(() => {
    if (graphEdges.length > 0) {
      const reactFlowEdges = graphEdges.map(edge => {
        const flowPercentage = edge.capacity > 0 
          ? (edge.flow / edge.capacity) 
          : 0;
        
        return {
          id: `${edge.source}-${edge.target}`,
          source: edge.source.toString(),
          target: edge.target.toString(),
          label: `${edge.flow}/${edge.capacity}`,
          style: {
            strokeWidth: 2 + (flowPercentage * 3),
            stroke: flowPercentage > 0 
              ? `rgba(255, 0, 0, ${flowPercentage})` // Red for flow
              : '#b1b1b7', // Gray default
            transition: 'all 0.3s ease'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: flowPercentage > 0 ? `rgba(255, 0, 0, ${flowPercentage})` : '#b1b1b7',
          },
          animated: edge.flow > 0
        };
      });
      
      setEdges(reactFlowEdges);
    }
  }, [graphEdges]);
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    algorithmService.connect();
    
    return () => {
      algorithmService.disconnect();
    };
  }, []);
  
  return (
    <div className="w-full h-full">
      <div className="absolute top-4 right-4 z-10 bg-white p-3 rounded-lg shadow-md text-sm">
        <div className="flex flex-col space-y-1">
          <div><span className="font-bold">Current Flow:</span> {currentFlow}</div>
          <div><span className="font-bold">Max Flow:</span> {maxFlow}</div>
          <div><span className="font-bold">Iteration:</span> {iteration}</div>
          <div><span className="font-bold">Status:</span> {isRunning ? 'Running...' : 'Idle'}</div>
        </div>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default VisualizingGraph;