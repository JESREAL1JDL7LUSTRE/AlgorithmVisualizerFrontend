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

const EdgeLegendItem = ({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) => (
  <div className="flex items-center gap-2">
    <div className="w-10 h-3 flex items-center">
      <div 
        className="w-full h-1"
        style={{ 
          backgroundColor: color,
          borderTop: dashed ? '2px dashed ' + color : 'none'
        }}
      />
    </div>
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
          <LegendItem color="#60a5fa" label="Path Node" />
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-medium">Edges</h4>
          <div className="grid grid-cols-2 gap-2">
            <EdgeLegendItem color="#b1b1b7" label="No Flow" />
            <EdgeLegendItem color="rgba(255, 0, 0, 0.3)" label="Low Flow" />
            <EdgeLegendItem color="rgba(255, 0, 0, 0.7)" label="Medium Flow" />
            <EdgeLegendItem color="rgba(255, 0, 0, 1)" label="Max Flow" />
            <EdgeLegendItem color="#3b82f6" label="DFS Path" dashed={true} />
            <EdgeLegendItem color="#ffc107" label="Examining (No Flow)" dashed={true} />
            <EdgeLegendItem color="#ff8800" label="Examining (With Flow)" dashed={true} />
            <EdgeLegendItem color="#9ca3af" label="Examined (No Flow)" />
            <EdgeLegendItem color="#dd4444" label="Examined (Low Flow)" />
            <EdgeLegendItem color="#cc2222" label="Examined (Medium Flow)" />
            <EdgeLegendItem color="#aa0000" label="Examined (Max Flow)" />
            <EdgeLegendItem color="#93c5fd" label="Rejected Path" dashed={true} />
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-600">
          <p>Edge labels show current flow / capacity</p>
          <p>Animated edges indicate active flow paths or current examination</p>
          <p>Dashed blue edges show the current DFS path</p>
          <p>Orange/yellow dashed edges show edges being examined</p>
          <p>Red shades show examined edges with different flow levels:</p>
          <ul className="list-disc pl-4 mt-1">
            <li>Light red (#dd4444): Low flow (less than 40% of capacity)</li>
            <li>Medium red (#cc2222): Medium flow (40-80% of capacity)</li>
            <li>Dark red (#aa0000): High flow (over 80% of capacity)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GraphLegend;