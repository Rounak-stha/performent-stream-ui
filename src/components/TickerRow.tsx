import React, { memo } from 'react';
import type { TickerState } from '@/types/ticker';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Individual ticker row component
 * 
 * Uses React.memo for performance - prevents re-renders unless props change.
 * This is critical when you have thousands of rows.
 * 
 * Features:
 * - Flash animation on price updates (via CSS classes)
 * - Color coding for price direction
 * - Smooth transitions
 */

interface TickerRowProps {
  ticker: TickerState;
  index: number;
  rowHeight: number;
}

export const TickerRow = memo(function TickerRow({ 
  ticker, 
  index, 
  rowHeight 
}: TickerRowProps) {
  const isEven = index % 2 === 0;
  const isUp = ticker.change > 0;
  const isDown = ticker.change < 0;
  
  // Determine flash animation class
  const flashClass = ticker.flashDirection === 'up' 
    ? 'flash-up' 
    : ticker.flashDirection === 'down' 
      ? 'flash-down' 
      : '';
  
  // Format price with 2 decimal places
  const formattedPrice = ticker.price.toFixed(2);
  
  // Format change percentage
  const formattedChange = `${isUp ? '+' : ''}${ticker.change.toFixed(2)}%`;
  
  // Format volume with K/M suffixes
  const formattedVolume = ticker.volume >= 1000000 
    ? `${(ticker.volume / 1000000).toFixed(1)}M`
    : ticker.volume >= 1000 
      ? `${(ticker.volume / 1000).toFixed(0)}K`
      : ticker.volume.toString();
  
  return (
    <div 
      className={`
        ticker-row 
        ${isEven ? 'ticker-row-even' : 'ticker-row-odd'}
        ${flashClass}
      `}
      style={{ height: rowHeight }}
    >
      {/* Symbol */}
      <div className="w-24 font-semibold text-foreground">
        {ticker.symbol}
      </div>
      
      {/* Price */}
      <div className={`w-32 tabular-nums text-right font-medium ${
        isUp ? 'price-up' : isDown ? 'price-down' : 'price-neutral'
      }`}>
        ${formattedPrice}
      </div>
      
      {/* Change indicator with icon */}
      <div className={`w-28 flex items-center justify-end gap-1 tabular-nums ${
        isUp ? 'price-up' : isDown ? 'price-down' : 'price-neutral'
      }`}>
        {isUp ? (
          <TrendingUp className="w-3 h-3" />
        ) : isDown ? (
          <TrendingDown className="w-3 h-3" />
        ) : (
          <Minus className="w-3 h-3" />
        )}
        <span>{formattedChange}</span>
      </div>
      
      {/* Volume */}
      <div className="w-24 text-right text-muted-foreground tabular-nums">
        {formattedVolume}
      </div>
      
      {/* Last update time */}
      <div className="flex-1 text-right text-xs text-muted-foreground/60">
        {new Date(ticker.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
});
