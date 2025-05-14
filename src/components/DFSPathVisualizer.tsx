"use client"
import React, { useEffect, useState } from 'react';
import { useGraphStore } from '@/lib/api/fastApi';

const DFSPathVisualizer = () => {
  const { currentPath, edges, inDFS } = useGraphStore();
  const [pathSegments, setPathSegments] = useState<{ from: number; to: number; index: number }[]>([]);
  
  useEffect(() => {
    // Create path segments from the current path
    if (currentPath && currentPath.length > 1) {
      const segments = [];
      for (let i = 0; i < currentPath.length - 1; i++) {
        segments.push({
          from: currentPath[i],
          to: currentPath[i + 1],
          index: i
        });
      }
      setPathSegments(segments);
    } else {
      setPathSegments([]);
    }
  }, [currentPath]);
  
  if (!inDFS || pathSegments.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">DFS Path Visualization</h3>
        <p className="text-sm text-gray-500">No active DFS path</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-3">DFS Path Visualization</h3>
      
      <div className="relative border border-gray-200 rounded-lg p-2 mb-3 bg-gray-50">
        <div className="flex flex-wrap items-center justify-center p-2">
          {currentPath.map((nodeId, index) => (
            <React.Fragment key={nodeId}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                ${index === 0 ? 'bg-green-500 text-white' : 
                  index === currentPath.length - 1 ? 'bg-red-500 text-white' : 
                  'bg-blue-400 text-white'}`}
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
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        <h4 className="text-sm font-medium">Path Details:</h4>
        {pathSegments.map((segment, idx) => {
          const pathEdge = edges.find(e => e.source === segment.from && e.target === segment.to);
          return (
            <div key={idx} className="flex items-center text-sm bg-gray-50 p-2 rounded">
              <div className="w-16 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-400 text-white text-xs mr-1">
                  {segment.from}
                </span>
                <span className="mx-1">→</span>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-400 text-white text-xs">
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
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span>Source Node</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span>Sink Node</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-400 mr-1"></div>
          <span>Path Node</span>
        </div>
      </div>
    </div>
  );
};

export default DFSPathVisualizer;