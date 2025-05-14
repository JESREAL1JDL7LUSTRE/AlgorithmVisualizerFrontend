// src/hooks/useAlgorithm.ts
import { useEffect, useState, useCallback } from 'react';
import { algorithmService, useGraphStore } from '@/lib/api/fastApi';
import { AlgorithmConfig } from '@/lib/types';

export const useAlgorithm = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState(0);
  
  const {
    isRunning,
    maxFlow,
    currentFlow,
    iteration,
    inBFS,
    inDFS,
    algorithm,
    graphType,
    speed
  } = useGraphStore();
  
  // Try to connect to the WebSocket server
  const connectToServer = useCallback(() => {
    setIsConnecting(true);
    setLastConnectionAttempt(Date.now());
    
    try {
      algorithmService.connect();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError('Failed to connect to WebSocket server');
      console.error('WebSocket connection error:', err);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);
  
  // Reconnect logic with exponential backoff
  useEffect(() => {
    if (!isConnected && !isConnecting && reconnectCount < 5) {
      const now = Date.now();
      const timeSinceLastAttempt = now - lastConnectionAttempt;
      
      // Exponential backoff: wait longer between retries
      const backoffTime = Math.min(1000 * Math.pow(2, reconnectCount), 30000);
      
      if (timeSinceLastAttempt >= backoffTime) {
        const reconnectTimer = setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectCount + 1}/5)...`);
          connectToServer();
          setReconnectCount(prev => prev + 1);
        }, backoffTime);
        
        return () => clearTimeout(reconnectTimer);
      }
    }
  }, [isConnected, isConnecting, reconnectCount, lastConnectionAttempt, connectToServer]);
  
  // Initial connection attempt
  useEffect(() => {
    connectToServer();
    
    return () => {
      algorithmService.disconnect();
      setIsConnected(false);
    };
  }, [connectToServer]);
  
  // Reset reconnect count when successfully connected
  useEffect(() => {
    if (isConnected) {
      setReconnectCount(0);
    }
  }, [isConnected]);
  
  // Start algorithm with proper error handling
  const startAlgorithm = useCallback(async (config: AlgorithmConfig) => {
    setError(null);
    
    if (!isConnected) {
      setError('Not connected to server. Please wait for connection to establish.');
      return;
    }
    
    try {
      await algorithmService.startAlgorithm(config);
    } catch (err) {
      let errorMessage = 'Failed to start algorithm';
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      }
      setError(errorMessage);
      console.error('Start algorithm error:', err);
    }
  }, [isConnected]);
  
  // Stop algorithm with proper error handling
  const stopAlgorithm = useCallback(async () => {
    setError(null);
    
    if (!isConnected) {
      setError('Not connected to server');
      return;
    }
    
    try {
      await algorithmService.stopAlgorithm();
    } catch (err) {
      let errorMessage = 'Failed to stop algorithm';
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      }
      setError(errorMessage);
      console.error('Stop algorithm error:', err);
    }
  }, [isConnected]);
  
  // Manual reconnect function the user can call
  const reconnect = useCallback(() => {
    if (!isConnecting) {
      setReconnectCount(0);
      connectToServer();
    }
  }, [isConnecting, connectToServer]);
  
  return {
    isConnected,
    isConnecting,
    isRunning,
    maxFlow,
    currentFlow,
    iteration,
    inBFS,
    inDFS,
    algorithm,
    graphType,
    speed,
    error,
    startAlgorithm,
    stopAlgorithm,
    reconnect
  };
};