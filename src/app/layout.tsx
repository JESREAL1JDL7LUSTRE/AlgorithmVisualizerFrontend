import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Flow Algorithm Visualizer',
  description: 'Visualize the Dinic\'s algorithm for maximum flow in a network',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <div className="flex min-h-screen flex-col">
          <nav className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="container mx-auto flex justify-between items-center">
              <div className="font-semibold text-xl">Flow Algorithm Visualizer</div>
              <div className="flex gap-4">
                <a 
                  href="https://github.com/JESREAL1JDL7LUSTRE/AlgorithmVisualizerFrontend" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                >
                  GitHub Frontend
                </a>
                <a 
                  href="https://github.com/JESREAL1JDL7LUSTRE/AlgorithmVisualizerBackend" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                >
                  GitHub Backend
                </a>
              </div>
            </div>
          </nav>
          
          <main className="flex-grow">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}