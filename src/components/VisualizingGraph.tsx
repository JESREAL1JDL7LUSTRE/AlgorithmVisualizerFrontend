"use client"
import React, { useEffect, useMemo, useState } from 'react';
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
    currentPath,
    parallelPaths = [], // Add parallelPaths from state
    rejectedPaths = [], // Add default empty array to avoid undefined
    lastRejectedNode,
    bfsCurrentNode,
    bfsCurrentNodes = [], // Add bfsCurrentNodes from state
    dfsCurrentNode,
    dfsCurrentNodes = [], // Add dfsCurrentNodes from state
    bfsFrontier = []     // Add BFS frontier data
  } = useGraphStore();

  // New state to track BFS levels
  const [nodeLevels, setNodeLevels] = useState<Map<number, number>>(new Map());

  // Calculate which edges are part of the current path
  const pathEdges = useMemo(() => {
    const result = new Set();
    
    // Add edges from current path
    if (currentPath && currentPath.length > 1) {
      for (let i = 0; i < currentPath.length - 1; i++) {
        result.add(`${currentPath[i]}-${currentPath[i+1]}`);
      }
    }
    
    // Add edges from all parallel paths
    if (parallelPaths && parallelPaths.length > 0) {
      parallelPaths.forEach(path => {
        if (path && path.length > 1) {
          for (let i = 0; i < path.length - 1; i++) {
            result.add(`${path[i]}-${path[i+1]}`);
          }
        }
      });
    }
    
    return result;
  }, [currentPath, parallelPaths]);
  
  // Calculate which edges are part of rejected paths
  const rejectedPathEdges = useMemo(() => {
    const result = new Set();
    if (rejectedPaths && rejectedPaths.length > 0) {
      rejectedPaths.forEach(path => {
        if (path && path.length > 1) {
          for (let i = 0; i < path.length - 1; i++) {
            result.add(`${path[i]}-${path[i+1]}`);
          }
        }
      });
    }
    return result;
  }, [rejectedPaths]);

  // Calculate node levels based on BFS frontiers and visited nodes
  useEffect(() => {
    // Only update levels when in BFS mode
    if (inBFS || (visitedNodes.size > 0 && bfsFrontier.length > 0)) {
      const newLevels = new Map<number, number>();
      
      // Set source node to level 0
      if (currentPath.length > 0) {
        newLevels.set(currentPath[0], 0);
      }
      
      // Process each frontier to assign levels
      bfsFrontier.forEach((frontier, index) => {
        frontier.forEach(nodeId => {
          if (!newLevels.has(nodeId)) {
            newLevels.set(nodeId, index + 1);
          }
        });
      });
      
      // For nodes that are visited but not in a frontier, use the visitedNodes set
      // and try to infer levels from edges
      if (visitedNodes.size > 0) {
        visitedNodes.forEach(nodeId => {
          if (!newLevels.has(nodeId)) {
            // Try to find an edge from a node with a known level
            const incomingEdges = graphEdges.filter(edge => edge.target === nodeId);
            
            for (const edge of incomingEdges) {
              const sourceLevel = newLevels.get(edge.source);
              if (sourceLevel !== undefined) {
                newLevels.set(nodeId, sourceLevel + 1);
                break;
              }
            }
            
            // If we still can't determine the level, assign a default
            if (!newLevels.has(nodeId)) {
              newLevels.set(nodeId, 0);
            }
          }
        });
      }
      
      // If we have current BFS nodes, make sure they're at the right level
      if (bfsCurrentNodes.length > 0) {
        const currentLevel = Math.max(...Array.from(newLevels.values())) + 1;
        bfsCurrentNodes.forEach(nodeId => {
          if (!visitedNodes.has(nodeId)) {
            newLevels.set(nodeId, currentLevel);
          }
        });
      }
      
      setNodeLevels(newLevels);
    }
  }, [inBFS, visitedNodes, bfsFrontier, bfsCurrentNodes, graphEdges, currentPath]);
  
  // In the ReactFlow nodes generation
  useEffect(() => {
    if (graphNodes.length > 0) {
      const maxLevel = Math.max(...Array.from(nodeLevels.values()), 0);
      const levelWidth = 180; // Reduced horizontal spacing between levels (was 300)
      
      // Calculate how many nodes are at each level for positioning
      const nodesPerLevel = new Map<number, number[]>();
      
      // Initialize the map
      for (let i = 0; i <= maxLevel; i++) {
        nodesPerLevel.set(i, []);
      }
      
      // Group nodes by level
      graphNodes.forEach(node => {
        const level = nodeLevels.get(node.id) || 0;
        const nodesAtLevel = nodesPerLevel.get(level) || [];
        nodesAtLevel.push(node.id);
        nodesPerLevel.set(level, nodesAtLevel);
      });
      
      const reactFlowNodes = graphNodes.map(node => {
        const isVisited = visitedNodes.has(node.id);
        const isInPath = currentPath && currentPath.includes(node.id);
        const isSource = currentPath && currentPath.length > 0 && currentPath[0] === node.id;
        const isSink = currentPath && currentPath.length > 0 && currentPath[currentPath.length - 1] === node.id;
        
        // Check if node is in any parallel path
        const isInParallelPath = parallelPaths && 
          parallelPaths.some(path => path && path.includes(node.id));
        
        // Add this to check if node is in any rejected path
        const isInRejectedPath = rejectedPaths && 
          rejectedPaths.some(path => path && path.includes(node.id));
        const isLastRejected = lastRejectedNode === node.id;
        
        // Use the explicit dfsCurrentNode state
        const isDFSCurrent = node.id === dfsCurrentNode;
        
        // Check if this is one of the current DFS nodes in parallel paths
        const isParallelDFSCurrent = dfsCurrentNodes && dfsCurrentNodes.includes(node.id);
        
        // Check if this is the current BFS node
        const isBFSCurrent = node.id === bfsCurrentNode;
        
        // Check if this is one of the current BFS nodes in parallel frontier
        const isParallelBFSCurrent = bfsCurrentNodes && bfsCurrentNodes.includes(node.id);
        
        // Determine node color based on its state
        let nodeColor = '#ffffff'; // Default white
        
        // DFS current node has highest priority
        if (isDFSCurrent || isParallelDFSCurrent) {
          nodeColor = '#ff9900'; // Orange for DFS current
        }
        // Then BFS current node
        else if (isBFSCurrent || isParallelBFSCurrent) {
          nodeColor = '#ffcc00';  // Yellow for current BFS node
        }
        // Then DFS path coloring
        else if (inDFS || currentPath.length > 0) {
          if (isSource) {
            nodeColor = '#22c55e'; // Green for source
          } else if (isSink) {
            nodeColor = '#ef4444'; // Red for sink
          } else if (isInPath || isInParallelPath) {
            nodeColor = '#60a5fa'; // Blue for path nodes
          } else if (isLastRejected) {
            nodeColor = '#f97316'; // Orange for dead-end node
          } else if (isInRejectedPath) {
            nodeColor = '#93c5fd'; // Light blue for rejected path nodes
          } else if (isVisited) {
            nodeColor = '#4dabf7'; // Blue for visited
          }
        } 
        // Then general visited nodes
        else if (isVisited) {  
          nodeColor = '#4dabf7';  // Blue for visited
        }

        // Calculate position based on BFS level if available, otherwise use original position
        let position = { x: node.x, y: node.y };
        
        // Use level-based positioning when in BFS mode or if we have level data
        if (inBFS || nodeLevels.size > 0) {
          const level = nodeLevels.get(node.id) || 0;
          const nodesAtLevel = nodesPerLevel.get(level) || [];
          const indexInLevel = nodesAtLevel.indexOf(node.id);
          
          if (indexInLevel !== -1) {
            const totalNodesAtLevel = nodesAtLevel.length;
            const verticalSpacing = Math.max(40, 400 / (totalNodesAtLevel + 1)); // Adjusted vertical spacing
            
            position = {
              x: level * levelWidth + 80, // Reduced horizontal offset (was 100)
              y: (indexInLevel + 1) * verticalSpacing
            };
          }
        }

        return {
          id: node.id.toString(),
          position: position,
          data: { label: `Node ${node.id}` },
          style: {
            background: nodeColor,
            border: isDFSCurrent ? '3px solid #ff9900' :
                   isParallelDFSCurrent ? '3px solid #ff9900' :
                   isBFSCurrent ? '3px solid #ffcc00' :
                   isParallelBFSCurrent ? '3px solid #ffcc00' :
                   isInPath || isInParallelPath ? '2px solid #3b82f6' : 
                   isInRejectedPath ? '2px solid #93c5fd' :
                   isLastRejected ? '2px solid #f97316' :
                   '1px solid #1a192b',
            borderRadius: '50%',
            width: isDFSCurrent || isParallelDFSCurrent || isBFSCurrent || isParallelBFSCurrent ? 55 : 
                  (isInPath || isInParallelPath) ? 45 : 40,
            height: isDFSCurrent || isParallelDFSCurrent || isBFSCurrent || isParallelBFSCurrent ? 55 : 
                   (isInPath || isInParallelPath) ? 45 : 40,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: isDFSCurrent || isParallelDFSCurrent || isBFSCurrent || isParallelBFSCurrent ? '14px' : '10px',
            fontWeight: isDFSCurrent || isParallelDFSCurrent || isBFSCurrent || isParallelBFSCurrent ? '800' : 
                       (isInPath || isInParallelPath) || isLastRejected ? 'bold' : 'normal',
            color: isDFSCurrent || isParallelDFSCurrent || isBFSCurrent || isParallelBFSCurrent ? '#000000' : 
                  nodeColor === '#ffffff' ? '#1a192b' : '#000000',
            transition: 'all 0.2s ease',
            boxShadow: isDFSCurrent || isParallelDFSCurrent
              ? '0 0 12px rgba(255, 153, 0, 0.8)' 
              : isBFSCurrent || isParallelBFSCurrent
                ? '0 0 12px rgba(255, 204, 0, 0.8)'
                : (isInPath || isInParallelPath) 
                  ? '0 0 8px rgba(59, 130, 246, 0.6)' 
                  : isLastRejected
                    ? '0 0 8px rgba(249, 115, 22, 0.6)'
                    : 'none',
            // Add a z-index to ensure current nodes stay on top
            zIndex: isDFSCurrent || isParallelDFSCurrent || isBFSCurrent || isParallelBFSCurrent ? 1000 : 'auto'
          }
        };
      });
      
      setNodes(reactFlowNodes);
    }
  }, [graphNodes, visitedNodes, inBFS, inDFS, currentPath, parallelPaths, rejectedPaths, lastRejectedNode, bfsCurrentNode, bfsCurrentNodes, dfsCurrentNode, dfsCurrentNodes, nodeLevels]);
  
  // Transform graph edges to ReactFlow edges
  useEffect(() => {
    if (graphEdges.length > 0) {
      const reactFlowEdges = graphEdges.map(edge => {
        const edgeId = `${edge.source}-${edge.target}`;
        const isInPath = pathEdges.has(edgeId);
        const isInRejectedPath = rejectedPathEdges.has(edgeId);
        const flowPercentage = edge.capacity > 0 
          ? (edge.flow / edge.capacity) 
          : 0;
        
        return {
          id: edgeId,
          source: edge.source.toString(),
          target: edge.target.toString(),
          label: `${edge.flow}/${edge.capacity}`,
          style: {
            strokeWidth: isInPath && inDFS ? 4 
              : isInRejectedPath && inDFS ? 3 
              : edge.isExamining ? 5  // Make examining edges thicker for better visibility
              : edge.isExamined ? 3
              : 2 + (flowPercentage * 3),
            stroke: isInPath && inDFS 
              ? '#3b82f6' // Blue for path edges
              : isInRejectedPath && inDFS
                ? '#93c5fd' // Light blue for rejected paths
              : edge.isExamining
                ? flowPercentage > 0.5 ? '#ff8800' : '#ffc107' // Orange-yellow for examining edges with flow
              : edge.isExamined
                ? flowPercentage <= 0 ? '#9ca3af' : // Gray for no flow
                  flowPercentage < 0.4 ? '#dd4444' : // Red for low flow
                  flowPercentage < 0.8 ? '#cc2222' : // Darker red for medium flow
                  '#aa0000' // Darkest red for max flow
                : flowPercentage > 0 
                  ? `rgba(255, 0, 0, ${Math.min(0.3 + flowPercentage * 0.7, 1)})` // Red with varying opacity based on flow
                  : '#b1b1b7', // Gray default
            transition: 'all 0.3s ease',
            strokeDasharray: (isInPath || isInRejectedPath) && inDFS ? '5,5' 
              : edge.isExamining ? '3,3'  // Different dash pattern for examining edges
              : 'none',
            opacity: edge.isExamined && !edge.isExamining && !isInPath ? 0.7 : 1
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isInPath && inDFS 
              ? '#3b82f6'
              : isInRejectedPath && inDFS
                ? '#93c5fd'
              : edge.isExamining
                ? flowPercentage > 0.5 ? '#ff8800' : '#ffc107'
              : edge.isExamined
                ? flowPercentage <= 0 ? '#9ca3af' : // Gray for no flow
                  flowPercentage < 0.4 ? '#dd4444' : // Red for low flow
                  flowPercentage < 0.8 ? '#cc2222' : // Darker red for medium flow
                  '#aa0000' // Darkest red for max flow
                : flowPercentage > 0 
                  ? `rgba(255, 0, 0, ${Math.min(0.3 + flowPercentage * 0.7, 1)})` 
                  : '#b1b1b7',
          },
          animated: isInPath || edge.flow > 0 || edge.isExamining,
          zIndex: isInPath && inDFS ? 1000 
            : isInRejectedPath && inDFS ? 800 
            : edge.isExamining ? 900
            : edge.isExamined ? 700
            : 0 // Bring active edges to front
        };
      });
      
      setEdges(reactFlowEdges);
    }
  }, [graphEdges, pathEdges, rejectedPathEdges, inDFS]);
  
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
          <div><span className="font-bold">Status:</span> {isRunning 
            ? (inBFS) 
              ? 'Running BFS...' 
              : (inDFS)
                ? 'Running DFS...' 
                : 'Running...' 
            : 'Idle'}</div>
          
          {/* Display BFS frontier */}
          {inBFS && bfsCurrentNodes && bfsCurrentNodes.length > 0 && (
            <div>
              <span className="font-bold">BFS Frontier:</span> {bfsCurrentNodes.length} nodes
              <div className="flex flex-wrap items-center mt-1">
                {bfsCurrentNodes.map((nodeId) => (
                  <span 
                    key={nodeId}
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-black text-xs mr-1 mb-1"
                  >
                    {nodeId}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Display BFS levels if available */}
          {inBFS && nodeLevels.size > 0 && (
            <div>
              <span className="font-bold">BFS Levels:</span>
              <div className="max-h-24 overflow-y-auto mt-1">
                {Array.from(new Set(Array.from(nodeLevels.values()))).sort((a, b) => a - b).map(level => (
                  <div key={level} className="mb-1">
                    <div className="text-xs text-gray-500">Level {level}:</div>
                    <div className="flex flex-wrap items-center">
                      {Array.from(nodeLevels.entries())
                        .filter(([, nodeLevel]) => nodeLevel === level)
                        .map(([nodeId]) => (
                          <span 
                            key={nodeId}
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs mr-1 mb-1
                              ${bfsCurrentNodes.includes(Number(nodeId))
                                ? 'bg-yellow-400 text-black font-bold' 
                                : 'bg-blue-500'}`}
                          >
                            {nodeId}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Display parallel paths */}
          {parallelPaths && parallelPaths.length > 0 && (
            <div>
              <span className="font-bold">Parallel Paths:</span> {parallelPaths.length}
              <div className="max-h-48 overflow-y-auto mt-1">
                {parallelPaths.map((path, pathIndex) => (
                  <div key={pathIndex} className="mb-1">
                    <div className="text-xs text-gray-500">Path {pathIndex + 1}:</div>
                    <div className="flex flex-wrap items-center">
                      {path.map((nodeId, index) => (
                        <React.Fragment key={`${pathIndex}-${nodeId}`}>
                          <span 
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs mr-1
                              ${dfsCurrentNodes.includes(nodeId)
                                ? 'bg-orange-500 font-bold' // Current DFS node
                                : 'bg-blue-500'}`}
                          >
                            {nodeId}
                          </span>
                          {index < path.length - 1 && (
                            <span className="mr-1">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Keep the current path display for compatibility */}
          {currentPath && currentPath.length > 0 && !parallelPaths.length && (
            <div>
              <span className="font-bold">Current Path:</span> 
              <div className="flex flex-wrap items-center mt-1">
                {currentPath.map((nodeId, index) => (
                  <React.Fragment key={nodeId}>
                    <span 
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs mr-1
                        ${nodeId === dfsCurrentNode
                          ? 'bg-orange-500 font-bold' // Current DFS node
                          : 'bg-blue-500'}`}
                    >
                      {nodeId}
                    </span>
                    {index < currentPath.length - 1 && (
                      <span className="mr-1">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
          
          {/* Display rejected paths count */}
          {rejectedPaths && rejectedPaths.length > 0 && (
            <div>
              <span className="font-bold">Rejected Paths:</span> {rejectedPaths.length}
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