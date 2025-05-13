// pages/index.tsx
import { useEffect, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import { 
  Box, 
  Button, 
  Container, 
  Heading, 
  Select, 
  Text, 
  Slider, 
  SliderTrack, 
  SliderThumb, 
  Alert, 
  HStack,
  VStack,
  Badge,
  Card,
  CardBody,
  Progress,
} from '@chakra-ui/react';

// API configuration
const API_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws';

// Node colors based on algorithm state
const nodeColors = {
  default: '#ccc',
  source: '#68D391',
  sink: '#F56565',
  visited: '#4299E1',
  active: '#ED8936',
  path: '#805AD5',
};

// Edge colors based on flow/capacity
const getEdgeStyle = (flow: number, capacity: number) => {
  // No flow yet
  if (flow === 0) {
    return {
      stroke: '#888',
      strokeWidth: 1.5,
    };
  }
  
  // Full capacity
  if (flow === capacity) {
    return {
      stroke: '#F56565',
      strokeWidth: 3,
    };
  }
  
  // Partial flow
  const colorIntensity = Math.max(0.3, flow / capacity);
  return {
    stroke: `rgba(66, 153, 225, ${colorIntensity})`,
    strokeWidth: 1.5 + (flow / capacity) * 2,
  };
};

// Custom node component
const FlowNode = ({ data }: any) => {
  return (
    <div
      style={{
        background: data.color,
        borderRadius: '50%',
        padding: 10,
        width: 50,
        height: 50,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: '2px solid #333',
        fontWeight: 'bold',
      }}
    >
      {data.label}
    </div>
  );
};

// Type definitions
interface AlgorithmState {
  status: 'idle' | 'running' | 'complete' | 'error';
  currentFlow: number;
  maxFlow: number | null;
  iteration: number;
  lastEvent: string;
  progress: number;
  executionTime: number | null;
}

interface GraphConfig {
  algorithms: string[];
  graphTypes: string[];
  predefinedGraphs: string[];
}

const FlowVisualizer = () => {
  // WebSocket state
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  // Graph visualization state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Algorithm control state
  const [algorithm, setAlgorithm] = useState('dinic');
  const [graphType, setGraphType] = useState('custom');
  const [graphFile, setGraphFile] = useState('SG.json');
  const [speed, setSpeed] = useState(1.0);
  
  // Config options from API
  const [config, setConfig] = useState<GraphConfig>({
    algorithms: ['dinic'],
    graphTypes: ['custom'],
    predefinedGraphs: ['SG.json'],
  });
  
  // Algorithm execution state
  const [algorithmState, setAlgorithmState] = useState<AlgorithmState>({
    status: 'idle',
    currentFlow: 0,
    maxFlow: null,
    iteration: 0,
    lastEvent: '',
    progress: 0,
    executionTime: null,
  });
  
  // Error handling
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  // Load configuration on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await axios.get(`${API_URL}/config`);
        setConfig(response.data);
        if (response.data.predefinedGraphs.length > 0) {
          setGraphFile(response.data.predefinedGraphs[0]);
        }
      } catch (err) {
        setError('Failed to load configuration. Is the backend server running?');
        console.error('Failed to load config:', err);
      }
    };
    
    loadConfig();
  }, []);

  // WebSocket connection management
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setSocket(ws);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setSocket(null);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error. Is the backend server running?');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleAlgorithmUpdate(data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    return () => {
      ws.close();
    };
  }, []);

  // Start the algorithm
  const startAlgorithm = async () => {
    try {
      setAlgorithmState({
        status: 'running',
        currentFlow: 0,
        maxFlow: null,
        iteration: 0,
        lastEvent: 'Starting algorithm...',
        progress: 0,
        executionTime: null,
      });
      
      setNodes([]);
      setEdges([]);
      setError(null);
      
      const response = await axios.post(`${API_URL}/start-algorithm`, {
        source: 0,
        algorithm,
        graph_type: graphType,
        graph_file: graphFile,
        speed,
      });
      
      console.log('Algorithm started:', response.data);
      
    } catch (err: any) {
      console.error('Failed to start algorithm:', err);
      setAlgorithmState((prev) => ({ ...prev, status: 'error' }));
      setError(err.response?.data?.detail || 'Failed to start algorithm');
      
      toast({
        title: 'Error',
        description: 'Failed to start algorithm',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Stop the algorithm
  const stopAlgorithm = async () => {
    try {
      await axios.post(`${API_URL}/stop-algorithm`);
      setAlgorithmState((prev) => ({ 
        ...prev, 
        status: 'idle',
        lastEvent: 'Algorithm stopped by user'
      }));
    } catch (err) {
      console.error('Failed to stop algorithm:', err);
      setError('Failed to stop algorithm');
    }
  };

  // Handle algorithm updates from WebSocket
  const handleAlgorithmUpdate = (data: any) => {
    console.log('Algorithm update:', data.type);
    
    switch (data.type) {
      case 'init':
        // Initialize the graph
        const initialNodes = data.nodes.map((node: any) => ({
          id: node.id.toString(),
          position: { x: node.x, y: node.y },
          data: { 
            label: node.id.toString(),
            color: node.id === 0 
              ? nodeColors.source 
              : (node.id === data.nodes.length - 1 ? nodeColors.sink : nodeColors.default) 
          },
          type: 'flowNode',
        }));
        
        const initialEdges = data.edges.map((edge: any, index: number) => ({
          id: `e${edge.source}-${edge.target}`,
          source: edge.source.toString(),
          target: edge.target.toString(),
          label: `${edge.flow}/${edge.capacity}`,
          style: getEdgeStyle(edge.flow, edge.capacity),
          animated: edge.flow > 0,
          data: {
            flow: edge.flow,
            capacity: edge.capacity,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }));
        
        setNodes(initialNodes);
        setEdges(initialEdges);
        setAlgorithmState((prev) => ({
          ...prev,
          lastEvent: 'Graph initialized',
        }));
        break;
      
      case 'node_visited':
        setNodes((nodes) =>
          nodes.map((node) => {
            if (node.id === data.node_id.toString()) {
              return {
                ...node,
                data: {
                  ...node.data,
                  color: 
                    node.id === '0' 
                      ? nodeColors.source 
                      : (node.id === (nodes.length - 1).toString() 
                        ? nodeColors.sink 
                        : nodeColors.visited),
                },
              };
            }
            return node;
          })
        );
        setAlgorithmState((prev) => ({
          ...prev,
          lastEvent: `Node ${data.node_id} visited`,
        }));
        break;
      
      case 'edge_explored':
        setEdges((edges) =>
          edges.map((edge) => {
            if (
              edge.source === data.source.toString() &&
              edge.target === data.target.toString()
            ) {
              return {
                ...edge,
                style: {
                  ...edge.style,
                  stroke: '#805AD5', // Highlight explored edge
                  strokeWidth: 2.5,
                },
                animated: true,
              };
            }
            return edge;
          })
        );
        setAlgorithmState((prev) => ({
          ...prev,
          lastEvent: `Edge ${data.source}->${data.target} explored (flow: ${data.flow}, capacity: ${data.capacity})`,
        }));
        break;
      
      case 'edge_updated':
        setEdges((edges) =>
          edges.map((edge) => {
            if (
              edge.source === data.source.toString() &&
              edge.target === data.target.toString()
            ) {
              return {
                ...edge,
                label: `${data.flow}/${data.capacity}`,
                style: getEdgeStyle(data.flow, data.capacity),
                animated: data.flow > 0,
                data: {
                  flow: data.flow,
                  capacity: data.capacity,
                },
              };
            }
            return edge;
          })
        );
        setAlgorithmState((prev) => ({
          ...prev,
          lastEvent: `Edge ${data.source}->${data.target} updated (flow: ${data.flow}/${data.capacity})`,
        }));
        break;
      
      case 'flow_update':
        setAlgorithmState((prev) => ({
          ...prev,
          currentFlow: data.current_flow,
          iteration: data.iteration,
          lastEvent: `Flow augmented by ${data.augmentation}`,
          progress: prev.maxFlow ? (data.current_flow / prev.maxFlow) * 100 : prev.progress,
        }));
        break;
      
      case 'iteration_start':
        setAlgorithmState((prev) => ({
          ...prev,
          iteration: data.iteration,
          lastEvent: `Starting iteration ${data.iteration}`,
        }));
        break;
      
      case 'bfs_start':
        setAlgorithmState((prev) => ({
          ...prev,
          lastEvent: 'BFS search started',
        }));
        break;
      
      case 'bfs_complete':
        setAlgorithmState((prev) => ({
          ...prev,
          lastEvent: data.path_found
            ? 'BFS found an augmenting path'
            : 'BFS could not find an augmenting path',
        }));
        break;
      
      case 'algorithm_complete':
        setAlgorithmState((prev) => ({
          ...prev,
          status: 'complete',
          maxFlow: data.max_flow,
          executionTime: data.execution_time_ms,
          lastEvent: 'Algorithm completed',
          progress: 100,
        }));
        
        toast({
          title: 'Algorithm Complete',
          description: `Max Flow: ${data.max_flow} | Time: ${data.execution_time_ms}ms`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        break;
      
      case 'ready':
        setAlgorithmState((prev) => ({
          ...prev,
          lastEvent: 'Algorithm ready to start',
        }));
        break;
      
      case 'error':
        setAlgorithmState((prev) => ({
          ...prev,
          status: 'error',
          lastEvent: `Error: ${data.message}`,
        }));
        setError(data.message);
        
        toast({
          title: 'Error',
          description: data.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        break;
      
      case 'result':
        setAlgorithmState((prev) => ({
          ...prev,
          maxFlow: data.max_flow,
          status: 'complete',
          lastEvent: `Final result: Max Flow = ${data.max_flow}`,
          progress: 100,
        }));
        break;
        
      default:
        console.log('Unhandled algorithm update type:', data.type);
    }
  };

  // Node types for React Flow
  const nodeTypes = {
    flowNode: FlowNode,
  };

  return (
    <Container maxW="container.xl" py={5}>
      <VStack spacing={5} align="stretch">
        <Box textAlign="center" mb={5}>
          <Heading as="h1" size="xl" mb={2}>
            Flow Algorithm Visualizer
          </Heading>
          <Text fontSize="md" color="gray.600">
            Visualizing Dinic's Max Flow Algorithm in real-time
          </Text>
        </Box>

        {error && (
          <Alert status="error" mb={4} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <HStack spacing={5} align="flex-start">
          {/* Control Panel */}
          <Card width="300px" variant="outline">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Algorithm Controls</Heading>
                
                <FormControl>
                  <FormLabel>Algorithm</FormLabel>
                  <Select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    disabled={algorithmState.status === 'running'}
                  >
                    {config.algorithms.map((algo) => (
                      <option key={algo} value={algo}>
                        {algo.charAt(0).toUpperCase() + algo.slice(1)}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Graph</FormLabel>
                  <Select
                    value={graphFile}
                    onChange={(e) => setGraphFile(e.target.value)}
                    disabled={algorithmState.status === 'running'}
                  >
                    {config.predefinedGraphs.map((graph) => (
                      <option key={graph} value={graph}>
                        {graph}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Speed: {speed}x</FormLabel>
                  <Slider
                    min={0.25}
                    max={2}
                    step={0.25}
                    value={speed}
                    onChange={(val) => setSpeed(val)}
                    disabled={algorithmState.status === 'running'}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                </FormControl>

                <Divider />

                <Box>
                  {algorithmState.status === 'running' ? (
                    <Button
                      colorScheme="red"
                      width="full"
                      onClick={stopAlgorithm}
                    >
                      Stop Algorithm
                    </Button>
                  ) : (
                    <Button
                      colorScheme="blue"
                      width="full"
                      onClick={startAlgorithm}
                      isDisabled={!socket}
                    >
                      Start Algorithm
                    </Button>
                  )}
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={1}>
                    Status:
                    <Badge
                      ml={2}
                      colorScheme={
                        algorithmState.status === 'running'
                          ? 'blue'
                          : algorithmState.status === 'complete'
                          ? 'green'
                          : algorithmState.status === 'error'
                          ? 'red'
                          : 'gray'
                      }
                    >
                      {algorithmState.status.toUpperCase()}
                    </Badge>
                  </Text>
                  
                  {algorithmState.status === 'running' && (
                    <Progress 
                      value={algorithmState.progress} 
                      size="sm" 
                      colorScheme="blue" 
                      borderRadius="md"
                      mt={2}
                    />
                  )}
                  
                  <Text mt={2} fontSize="sm">
                    Current Flow: {algorithmState.currentFlow}
                  </Text>
                  
                  {algorithmState.maxFlow !== null && (
                    <Text fontSize="sm">
                      Max Flow: {algorithmState.maxFlow}
                    </Text>
                  )}
                  
                  {algorithmState.executionTime !== null && (
                    <Text fontSize="sm">
                      Execution Time: {algorithmState.executionTime}ms
                    </Text>
                  )}
                  
                  <Text fontSize="sm" mt={2}>
                    Iteration: {algorithmState.iteration}
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={1}>
                    Last Event:
                  </Text>
                  <Text fontSize="sm" noOfLines={3}>
                    {algorithmState.lastEvent}
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Graph Visualization */}
          <Box
            height="700px"
            flex="1"
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
          >
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
              >
                <Controls />
                <MiniMap />
                <Background color="#aaa" gap={16} />
              </ReactFlow>
            </ReactFlowProvider>
          </Box>
        </HStack>

        <Box mt={4}>
          <Text fontSize="sm" color="gray.500">
            This visualization shows Dinic's algorithm finding the maximum flow in a network.
            Nodes represent vertices in the graph, and edges show the flow/capacity.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

// Wrap with providers for proper initialization
const FlowVisualizerWithProviders = () => {
  return (
    <ReactFlowProvider>
        <FlowVisualizer />
    </ReactFlowProvider>
  );
};

export default FlowVisualizerWithProviders;