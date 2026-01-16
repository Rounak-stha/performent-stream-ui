import React from 'react';
import { useDataStream } from '@/hooks/useDataStream';
import { StatsCard } from '@/components/StatsCard';
import { ControlPanel } from '@/components/ControlPanel';
import { TickerTable } from '@/components/TickerTable';
import { Activity } from 'lucide-react';

/**
 * Real-Time Data Streaming Demo
 * 
 * This page demonstrates four key concepts for handling high-frequency data:
 * 
 * 1. BACKPRESSURE - Flow control when data arrives faster than UI can render
 * 2. BUFFERING - Collecting updates and applying them in batches
 * 3. COALESCING - Merging redundant updates for the same item
 * 4. WINDOWING - Virtual rendering to handle thousands of items
 * 
 * Architecture:
 * - Web Worker generates thousands of updates per minute
 * - useDataStream hook manages buffering, coalescing, and backpressure
 * - VirtualList component handles windowed rendering
 * - requestAnimationFrame ensures smooth UI updates
 */

const Index = () => {
  const {
    tickers,
    stats,
    config,
    isRunning,
    isWorkerReady,
    start,
    stop,
    updateConfig,
    resetStats
  } = useDataStream({
    updatesPerSecond: 100,
    bufferIntervalMs: 50,
    throttleThreshold: 500
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Real-Time Data Stream Demo
              </h1>
              <p className="text-sm text-muted-foreground">
                Backpressure • Buffering • Coalescing • Windowing
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`pulse-indicator ${isRunning ? 'pulse-indicator-active' : 'pulse-indicator-throttled'}`} />
            <span className="text-sm text-muted-foreground">
              {isRunning ? 'Streaming' : isWorkerReady ? 'Ready' : 'Initializing...'}
            </span>
          </div>
        </header>
        
        {/* Stats Dashboard */}
        <section>
          <StatsCard stats={stats} />
        </section>
        
        {/* Control Panel */}
        <section>
          <ControlPanel
            config={config}
            isRunning={isRunning}
            onConfigChange={updateConfig}
            onStart={start}
            onStop={stop}
            onReset={resetStats}
          />
        </section>
        
        {/* Ticker Table */}
        <section className="h-[calc(100vh-380px)] min-h-[400px]">
          <TickerTable 
            tickers={tickers} 
            rowHeight={config.rowHeight}
          />
        </section>
        
        {/* Concept Explanations */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ConceptCard
            title="Backpressure"
            description="When buffer exceeds threshold, update consumption slows down adaptively. Prevents UI from being overwhelmed by data floods."
            color="primary"
          />
          <ConceptCard
            title="Buffering"
            description="Updates are collected over intervals (e.g., 50ms) and applied in batches via requestAnimationFrame for smooth rendering."
            color="primary"
          />
          <ConceptCard
            title="Coalescing"
            description="Multiple updates for the same symbol in one buffer window are merged—only the latest value is kept and rendered."
            color="primary"
          />
          <ConceptCard
            title="Windowing"
            description="Virtual list renders only visible rows. Thousands of items exist in state, but only ~20 DOM nodes are created."
            color="primary"
          />
        </section>
      </div>
    </div>
  );
};

interface ConceptCardProps {
  title: string;
  description: string;
  color: 'primary' | 'destructive';
}

function ConceptCard({ title, description }: ConceptCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default Index;
