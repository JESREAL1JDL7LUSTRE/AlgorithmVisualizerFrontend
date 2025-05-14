"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { algorithmService, useGraphStore } from '@/lib/api/fastApi';

interface AlgorithmConfig {
  algorithms: string[];
  graph_types: string[];
  predefined_graphs: string[];
}

const AlgorithmControlPanel = () => {
  const [config, setConfig] = useState<AlgorithmConfig | null>(null);
  const [source, setSource] = useState<number>(0);
  const [sink, setSink] = useState<number | null>(null);
  const [algorithm, setAlgorithm] = useState<string>('improveAlgorithm');
  const [graphType, setGraphType] = useState<string>('custom');
  const [graphFile, setGraphFile] = useState<string>('SG.json');
  const [speed, setSpeed] = useState<number>(1.0);
  
  const { isRunning } = useGraphStore();
  
  // Fetch config when component mounts
  useEffect(() => {
    fetchConfig();
  }, []);
  
  const fetchConfig = async () => {
    try {
      const response = await fetch('http://localhost:8000/config');
      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }
      
      const data = await response.json();
      setConfig(data);
      
      // Set defaults from config
      if (data.algorithms.length > 0) {
        setAlgorithm(data.algorithms[0]);
      }
      
      if (data.graph_types.length > 0) {
        setGraphType(data.graph_types[0]);
      }
      
      if (data.predefined_graphs.length > 0) {
        setGraphFile(data.predefined_graphs[0]);
      }
      
    } catch (error) {
      console.error('Error fetching configuration:', error);
    }
  };
  
  const handleStartAlgorithm = () => {
    algorithmService.startAlgorithm({
      source,
      sink: sink ?? undefined,
      algorithm,
      graph_type: graphType,
      graph_file: graphFile,
      speed
    });
  };
  
  const handleStopAlgorithm = () => {
    algorithmService.stopAlgorithm();
  };
  
  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow w-full max-w-md">
      <h2 className="text-xl font-bold">Algorithm Controls</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="source">Source Node</Label>
          <Input
            id="source"
            type="number"
            value={source}
            onChange={(e) => setSource(parseInt(e.target.value))}
            min={0}
            disabled={isRunning}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sink">Sink Node</Label>
          <Input
            id="sink"
            type="number"
            value={sink || ''}
            onChange={(e) => setSink(e.target.value ? parseInt(e.target.value) : null)}
            min={0}
            disabled={isRunning}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="algorithm">Algorithm</Label>
        <Select 
          value={algorithm} 
          onValueChange={setAlgorithm}
          disabled={isRunning || !config?.algorithms.length}
        >
          <SelectTrigger id="algorithm">
            <SelectValue placeholder="Select Algorithm" />
          </SelectTrigger>
          <SelectContent>
            {config?.algorithms.map((algo) => (
              <SelectItem key={algo} value={algo}>
                {algo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="graphType">Graph Type</Label>
        <Select 
          value={graphType} 
          onValueChange={setGraphType}
          disabled={isRunning || !config?.graph_types.length}
        >
          <SelectTrigger id="graphType">
            <SelectValue placeholder="Select Graph Type" />
          </SelectTrigger>
          <SelectContent>
            {config?.graph_types.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="graphFile">Graph File</Label>
        <Select 
          value={graphFile} 
          onValueChange={setGraphFile}
          disabled={isRunning || !config?.predefined_graphs.length}
        >
          <SelectTrigger id="graphFile">
            <SelectValue placeholder="Select Graph File" />
          </SelectTrigger>
          <SelectContent>
            {config?.predefined_graphs.map((file) => (
              <SelectItem key={file} value={file}>
                {file}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="speed">Speed</Label>
          <span className="text-sm text-gray-500">{speed.toFixed(1)}x</span>
        </div>
        <Slider
          id="speed"
          min={0.1}
          max={3.0}
          step={0.1}
          value={[speed]}
          onValueChange={(values) => setSpeed(values[0])}
          disabled={isRunning}
        />
      </div>
      
      <div className="flex gap-2">
        <Button 
          className="flex-1" 
          onClick={handleStartAlgorithm}
          disabled={isRunning}
        >
          Start
        </Button>
        <Button 
          className="flex-1" 
          variant="destructive" 
          onClick={handleStopAlgorithm}
          disabled={!isRunning}
        >
          Stop
        </Button>
      </div>
    </div>
  );
};

export default AlgorithmControlPanel;