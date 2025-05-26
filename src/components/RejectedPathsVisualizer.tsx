"use client"
import React, { useState } from 'react';
import { useGraphStore } from '@/lib/api/fastApi';

const RejectedPathsVisualizer = () => {
  const { rejectedPaths = [], edges, lastRejectedNode } = useGraphStore();
  const [selectedPathIndex, setSelectedPathIndex] = useState<number | null>(null);
  
  // Only check if there are rejected paths
  if (!rejectedPaths.length) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">Rejected Paths</h3>
        <p className="text-sm text-gray-500">No rejected paths available yet - they will appear here when the algorithm encounters dead ends.</p>
      </div>
    );
  }
  
  // Get the currently selected path or the most recent one
  const currentPath = selectedPathIndex !== null 
    ? rejectedPaths[selectedPathIndex] 
    : rejectedPaths[rejectedPaths.length - 1];
  
  // Create path segments from the current rejected path
  const pathSegments = [];
  if (currentPath && currentPath.length > 1) {
    for (let i = 0; i < currentPath.length - 1; i++) {
      pathSegments.push({
        from: currentPath[i],
        to: currentPath[i + 1],
        index: i
      });
    }
  }
  
  // Find why this path was rejected (last node in the path)
  const deadEndNode = currentPath && currentPath.length > 0 
    ? currentPath[currentPath.length - 1]
    : null;
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-3">Rejected Paths ({rejectedPaths.length})</h3>
      
      {/* Path selection dropdown */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Path:
        </label>
        <select 
          className="w-full p-2 border border-gray-300 rounded-md"
          value={selectedPathIndex !== null ? selectedPathIndex : rejectedPaths.length - 1}
          onChange={(e) => setSelectedPathIndex(parseInt(e.target.value))}
        >
          {rejectedPaths.map((path, index) => (
            <option key={index} value={index}>
              Path {index + 1}: {path.join(' → ')}
            </option>
          ))}
        </select>
      </div>
      
      {/* Visual representation of the path */}
      <div className="relative border border-gray-200 rounded-lg p-2 mb-3 bg-gray-50">
        <div className="flex flex-wrap items-center justify-center p-2">
          {currentPath && currentPath.map((nodeId, index) => (
            <React.Fragment key={nodeId}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                ${nodeId === deadEndNode ? 'bg-orange-500 text-white' : 
                  'bg-blue-300 text-white'}`}
              >
                {nodeId}
              </div>
              {index < currentPath.length - 1 && (
                <div className="mx-1 text-blue-800 font-bold">→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Path details */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        <h4 className="text-sm font-medium">Path Analysis:</h4>
        {pathSegments.map((segment, idx) => {
          const pathEdge = edges.find(e => e.source === segment.from && e.target === segment.to);
          return (
            <div key={idx} className="flex items-center text-sm bg-gray-50 p-2 rounded">
              <div className="w-16 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-300 text-white text-xs mr-1">
                  {segment.from}
                </span>
                <span className="mx-1">→</span>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-300 text-white text-xs">
                  {segment.to}
                </span>
              </div>
              <div className="ml-2 flex-1">
                {pathEdge && (
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600 mr-2">Flow/Capacity:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                        {pathEdge.flow}/{pathEdge.capacity}
                      </span>
                      {pathEdge.flow >= pathEdge.capacity && (
                        <span className="ml-2 text-xs text-red-600">
                          (Saturated)
                        </span>
                      )}
                    </div>
                    <div className="mt-1 w-full bg-gray-200 h-2 rounded overflow-hidden">
                      <div 
                        className="h-full bg-red-400"
                        style={{ width: `${(pathEdge.flow / pathEdge.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Dead end information */}
        {deadEndNode && (
          <div className="mt-3 p-2 bg-orange-100 rounded-md">
            <p className="text-sm font-medium text-orange-800">
              Path rejection at node {deadEndNode}:
            </p>
            <p className="text-xs text-orange-700 mt-1">
              {deadEndNode === lastRejectedNode ? (
                "This path was rejected because all outgoing edges from this node were either saturated or led to already visited nodes."
              ) : (
                "This path was rejected because no valid augmenting path could be found from this node to the sink."
              )}
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-blue-300 mr-1"></div>
          <span>Path Node</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
          <span>Dead End Node (caused rejection)</span>
        </div>
      </div>
    </div>
  );
};

export default RejectedPathsVisualizer;