import React from 'react';
import { useGraphStore } from '@/lib/api/fastApi';
import { Progress } from '@/components/ui/progress';

const AlgorithmStatusPanel = () => {
  const { 
    currentFlow, 
    maxFlow, 
    iteration, 
    isRunning, 
    inBFS, 
    inDFS,
    visitedNodes,
    nodes
  } = useGraphStore();

  // Calculate the progress percentage for visited nodes
  const totalNodes = nodes.length;
  const visitedNodeCount = visitedNodes.size;
  const visitedPercentage = totalNodes > 0 ? (visitedNodeCount / totalNodes) * 100 : 0;
  
  // Determine current phase
  const currentPhase = inBFS ? 'Finding Augmenting Path (BFS)' : 
                      inDFS ? 'Augmenting Flow (DFS)' : 
                      isRunning ? 'Processing...' : 'Idle';

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-3">Algorithm Status</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="text-sm font-medium">Status:</div>
          <div className="text-sm">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          
          <div className="text-sm font-medium">Current Phase:</div>
          <div className="text-sm">{currentPhase}</div>
          
          <div className="text-sm font-medium">Iteration:</div>
          <div className="text-sm">{iteration}</div>
          
          <div className="text-sm font-medium">Current Flow:</div>
          <div className="text-sm font-semibold">{currentFlow}</div>
          
          <div className="text-sm font-medium">Max Flow:</div>
          <div className="text-sm font-semibold">{maxFlow}</div>
          
          <div className="text-sm font-medium">Visited Nodes:</div>
          <div className="text-sm">{visitedNodeCount} / {totalNodes}</div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Progress</span>
            <span>{Math.round(visitedPercentage)}%</span>
          </div>
          <Progress value={visitedPercentage} className="h-2" />
        </div>
        
        {isRunning && (
          <div className="text-xs text-gray-500 italic">
            {inBFS ? 'Searching for a valid path from source to sink...' : 
             inDFS ? 'Pushing flow through the augmenting path...' : 
             'Preparing next iteration...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlgorithmStatusPanel;