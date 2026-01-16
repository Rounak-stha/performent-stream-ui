import React, { useRef, useState, useEffect } from 'react';
import type { TickerState } from '@/types/ticker';
import { VirtualList } from './VirtualList';

/**
 * Ticker Table Container
 * 
 * Wraps the VirtualList with a header and manages container sizing.
 * The table displays stock data in a clean, terminal-style format.
 */

interface TickerTableProps {
  tickers: TickerState[];
  rowHeight: number;
}

export function TickerTable({ tickers, rowHeight }: TickerTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);
  
  // Measure container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);
  
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full">
      {/* Table Header */}
      <div className="terminal-header px-4 py-3 flex items-center border-b border-border">
        <div className="w-24 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Symbol
        </div>
        <div className="w-32 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
          Price
        </div>
        <div className="w-28 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
          Change
        </div>
        <div className="w-24 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
          Volume
        </div>
        <div className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
          Updated
        </div>
      </div>
      
      {/* Virtual List Container */}
      <div ref={containerRef} className="flex-1 min-h-0">
        {containerHeight > 0 && (
          <VirtualList
            items={tickers}
            rowHeight={rowHeight}
            containerHeight={containerHeight}
            overscan={5}
          />
        )}
      </div>
      
      {/* Table Footer */}
      <div className="px-4 py-2 border-t border-border bg-muted/30">
        <div className="text-xs text-muted-foreground">
          Showing {tickers.length} symbols • Virtual rendering active
        </div>
      </div>
    </div>
  );
}
