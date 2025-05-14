"use client"
import React, { useEffect, useMemo } from 'react';
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
    inDFS,
    currentPath
  } = useGraphStore();

  // Calculate which edges are part of the current path
  const pathEdges = useMemo(() => {
    const result = new Set();
    if (currentPath && currentPath.length > 1) {
      for (let i = 0; i < currentPath.length - 1; i++) {
        result.add(`${currentPath[i]}-${currentPath[i+1]}`);
      }
    }
    return result;
  }, [currentPath]);
  
// Transform graph nodes to ReactFlow nodes
useEffect(() => {
  if (graphNodes.length > 0) {
    const reactFlowNodes = graphNodes.map(node => {
      const isVisited = visitedNodes.has(node.id);
      const isInPath = currentPath && currentPath.includes(node.id);
      const isSource = currentPath && currentPath.length > 0 && currentPath[0] === node.id;
      const isSink = currentPath && currentPath.length > 0 && currentPath[currentPath.length - 1] === node.id;
      
      // Get current node index in path (for DFS current highlighting)
      const pathIndex = currentPath ? currentPath.indexOf(node.id) : -1;
      const isDFSCurrent = inDFS && pathIndex > 0 && pathIndex < currentPath.length - 1; // Not source or sink, but in path
      
      // Determine node color based on its state
      let nodeColor = '#ffffff'; // Default white
      
      // DFS path coloring has priority
      if (inDFS) {
        if (isSource) {
          nodeColor = '#22c55e'; // Green for source
        } else if (isSink) {
          nodeColor = '#ef4444'; // Red for sink
        } else if (isDFSCurrent) {
          nodeColor = '#ff9900'; // Orange for DFS current (matching the legend)
        } else if (isInPath) {
          nodeColor = '#60a5fa'; // Blue for path nodes
        } else if (isVisited) {
          nodeColor = '#4dabf7'; // Blue for visited
        }
      } else if (inBFS && isVisited) {
        nodeColor = '#ffcc00'; // Yellow for BFS
      } else if (isVisited) {
        nodeColor = '#4dabf7'; // Blue for general visited
      }

      return {
        id: node.id.toString(),
        position: { x: node.x, y: node.y },
        data: { label: `Node ${node.id}` },
        style: {
          background: nodeColor,
          border: isInPath && inDFS ? '2px solid #3b82f6' : '1px solid #1a192b',
          borderRadius: '50%',
          width: (isInPath && inDFS) || isDFSCurrent ? 45 : 40,
          height: (isInPath && inDFS) || isDFSCurrent ? 45 : 40,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '10px',
          fontWeight: (isInPath && inDFS) || isDFSCurrent ? 'bold' : 'normal',
          color: nodeColor === '#ffffff' ? '#1a192b' : '#000000',
          transition: 'all 0.2s ease',
          boxShadow: (isInPath && inDFS) 
            ? '0 0 8px rgba(59, 130, 246, 0.6)' 
            : isDFSCurrent 
              ? '0 0 8px rgba(255, 153, 0, 0.6)' 
              : 'none'
        }
      };
    });
    
    setNodes(reactFlowNodes);
  }
}, [graphNodes, visitedNodes, inBFS, inDFS, currentPath]);
  
  // Transform graph edges to ReactFlow edges
  useEffect(() => {
    if (graphEdges.length > 0) {
      const reactFlowEdges = graphEdges.map(edge => {
        const edgeId = `${edge.source}-${edge.target}`;
        const isInPath = pathEdges.has(edgeId);
        const flowPercentage = edge.capacity > 0 
          ? (edge.flow / edge.capacity) 
          : 0;
        
        return {
          id: edgeId,
          source: edge.source.toString(),
          target: edge.target.toString(),
          label: `${edge.flow}/${edge.capacity}`,
          style: {
            strokeWidth: isInPath && inDFS ? 4 : 2 + (flowPercentage * 3),
            stroke: isInPath && inDFS 
              ? '#3b82f6' // Blue for path edges
              : flowPercentage > 0 
                ? `rgba(255, 0, 0, ${flowPercentage})` // Red for flow
                : '#b1b1b7', // Gray default
            transition: 'all 0.3s ease',
            strokeDasharray: isInPath && inDFS ? '5,5' : 'none'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isInPath && inDFS 
              ? '#3b82f6'
              : flowPercentage > 0 
                ? `rgba(255, 0, 0, ${flowPercentage})` 
                : '#b1b1b7',
          },
          animated: isInPath || edge.flow > 0,
          zIndex: isInPath && inDFS ? 1000 : 0 // Bring path edges to front
        };
      });
      
      setEdges(reactFlowEdges);
    }
  }, [graphEdges, pathEdges, inDFS]);
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    algorithmService.connect();
    
    return () => {
      algorithmService.disconnect();
    };
  }, []);
  
  return (
    <div className="w-full h-full">
      <div className="absolute top-15 right-4 z-10 bg-white p-3 rounded-lg shadow-md text-sm">
        <div className="flex flex-col space-y-1">
          <div><span className="font-bold">Current Flow:</span> {currentFlow}</div>
          <div><span className="font-bold">Max Flow:</span> {maxFlow}</div>
          <div><span className="font-bold">Iteration:</span> {iteration}</div>
          <div><span className="font-bold">Status:</span> {isRunning ? 'Running...' : 'Idle'}</div>
          {inDFS && currentPath && currentPath.length > 0 && (
            <div>
              <span className="font-bold">Current Path:</span> {currentPath.join(' → ')}
            </div>
          )}
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