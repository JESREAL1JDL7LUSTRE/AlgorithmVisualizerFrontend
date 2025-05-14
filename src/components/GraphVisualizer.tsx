"use client"
import React from 'react';
import VisualizingGraph from './VisualizingGraph';
import AlgorithmControlPanel from './AlgorithmControlPanel';
import GraphLegend from './GraphLegend';
import AlgorithmStatusPanel from './AlgorithmStatusPanel';
import AugmentingPathDisplay from './AugmentingPathDisplay';
import { useGraphStore } from '@/lib/api/fastApi';

const GraphVisualizer = () => {
  const { isRunning, inDFS } = useGraphStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 w-full h-[80vh]">
      <div className="flex flex-col gap-4 overflow-y-auto pb-4">
        <AlgorithmControlPanel />
        <AlgorithmStatusPanel />
        {isRunning && inDFS && <AugmentingPathDisplay />}
        <GraphLegend />
      </div>
      <div className="border-2 border-gray-300 rounded-md overflow-hidden bg-gray-50">
        <VisualizingGraph />
      </div>
    </div>
  );
};

export default GraphVisualizer;