import React from 'react';

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2">
    <div 
      className="w-4 h-4 rounded-sm"
      style={{ backgroundColor: color }}
    />
    <span className="text-sm">{label}</span>
  </div>
);

const GraphLegend = () => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-3">Legend</h3>
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Nodes</h4>
        <div className="grid grid-cols-2 gap-2">
          <LegendItem color="#ffffff" label="Unvisited" />
          <LegendItem color="#4dabf7" label="Visited" />
          <LegendItem color="#ffcc00" label="BFS Current" />
          <LegendItem color="#ff9900" label="DFS Current" />
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium">Edges</h4>
          <div className="grid grid-cols-2 gap-2">
            <LegendItem color="#b1b1b7" label="No Flow" />
            <LegendItem color="rgba(255, 0, 0, 0.3)" label="Low Flow" />
            <LegendItem color="rgba(255, 0, 0, 0.7)" label="Medium Flow" />
            <LegendItem color="rgba(255, 0, 0, 1)" label="Max Flow" />
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-600">
          <p>Edge labels show current flow / capacity</p>
          <p>Animated edges indicate active flow paths</p>
        </div>
      </div>
    </div>
  );
};

export default GraphLegend;