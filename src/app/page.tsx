import React from 'react';
import GraphVisualizer from "@/components/GraphVisualizer";

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center">Flow Algorithm Visualizer</h1>
        <p className="text-center text-gray-600 mt-2">
          Visualize the Improved algorithm for maximum flow in a network
        </p>
      </header>
      
      <GraphVisualizer />
      
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>C++ Algorithm Core + FastAPI Backend + Next.js Frontend</p>
        <p className="mt-1">© {new Date().getFullYear()} Flow Algorithm Visualizer</p>
      </footer>
    </main>
  );
}