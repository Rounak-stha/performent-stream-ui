import React, { useCallback, useRef, useState, useEffect } from 'react';
import type { TickerState } from '@/types/ticker';
import { TickerRow } from './TickerRow';

/**
 * WINDOWING / VIRTUALIZED RENDERING
 * 
 * This component implements virtual scrolling to handle thousands of items
 * while only rendering the visible subset. Key concepts:
 * 
 * 1. VIEWPORT CALCULATION
 *    - Only render items visible in the scroll container
 *    - Add overscan (extra items above/below) for smooth scrolling
 * 
 * 2. SPACE RESERVATION
 *    - Use padding to reserve space for non-rendered items
 *    - Maintains correct scroll height and position
 * 
 * 3. PERFORMANCE
 *    - Fixed height items for O(1) position calculation
 *    - Minimal re-renders via React.memo on rows
 */

interface VirtualListProps {
  items: TickerState[];
  rowHeight: number;
  containerHeight: number;
  overscan?: number; // Extra rows to render above/below viewport
}

export function VirtualList({ 
  items, 
  rowHeight, 
  containerHeight,
  overscan = 5 
}: VirtualListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  /**
   * Handle scroll events
   * We update scroll position state which triggers recalculation
   * of visible items
   */
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  // Total height of all items (for scroll container)
  const totalHeight = items.length * rowHeight;
  
  /**
   * VIEWPORT CALCULATION
   * Calculate which items are visible based on scroll position
   */
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / rowHeight) + overscan * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  
  // Slice only the visible items
  const visibleItems = items.slice(startIndex, endIndex);
  
  // Top padding to push visible items to correct position
  const offsetY = startIndex * rowHeight;
  
  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-auto terminal-scrollbar"
      style={{ height: containerHeight }}
    >
      {/* Inner container with full height for proper scroll */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Positioned container for visible items */}
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <TickerRow
              key={item.symbol}
              ticker={item}
              index={startIndex + index}
              rowHeight={rowHeight}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
