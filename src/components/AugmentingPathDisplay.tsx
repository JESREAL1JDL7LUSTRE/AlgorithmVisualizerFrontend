import React from 'react';
import { useGraphStore } from '@/lib/api/fastApi';

const AugmentingPathDisplay = () => {
  const { currentPath, edges, inDFS } = useGraphStore();
  
  // Skip rendering if there's no current path or not in DFS mode
  if (!currentPath || currentPath.length < 2 || !inDFS) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">Augmenting Path</h3>
        <p className="text-sm text-gray-500">No active augmenting path</p>
      </div>
    );
  }
  
  // Find the minimum flow in this path
  let minFlow = Infinity;
  const pathEdges = [];
  
  for (let i = 0; i < currentPath.length - 1; i++) {
    const source = currentPath[i];
    const target = currentPath[i + 1];
    
    // Find the corresponding edge
    const edge = edges.find(e => e.source === source && e.target === target);
    
    if (edge) {
      pathEdges.push(edge);
      const residualCapacity = edge.capacity - edge.flow;
      if (residualCapacity < minFlow) {
        minFlow = residualCapacity;
      }
    }
  }
  
  // If minFlow is still Infinity, set it to 0
  if (minFlow === Infinity) {
    minFlow = 0;
  }
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-3">Augmenting Path</h3>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <span className="text-sm font-medium">Path Flow:</span>
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
            {minFlow}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center">
          <span className="text-sm font-medium mr-2">Path:</span>
          <div className="flex flex-wrap items-center">
            {currentPath.map((nodeId, index) => (
              <React.Fragment key={nodeId}>
                <span className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                  {nodeId}
                </span>
                {index < currentPath.length - 1 && (
                  <span className="mx-1">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <div className="mt-2">
          <h4 className="text-sm font-medium mb-1">Edge Details:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {pathEdges.map((edge, index) => (
              <div key={index} className="flex items-center text-xs">
                <span className="w-16">({edge.source} → {edge.target})</span>
                <div className="ml-2 flex-1 bg-gray-200 h-4 rounded overflow-hidden relative">
                  <div 
                    className="absolute top-0 left-0 h-full bg-red-400"
                    style={{ width: `${(edge.flow / edge.capacity) * 100}%` }}
                  ></div>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                    {edge.flow}/{edge.capacity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AugmentingPathDisplay;