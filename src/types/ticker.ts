/**
 * Type definitions for the real-time data streaming demo
 */

// Single ticker update from the data worker
export interface TickerUpdate {
  symbol: string;
  price: number;
  change: number; // Percentage change
  volume: number;
  timestamp: number;
  id: string;
}

// Ticker state with additional UI metadata
export interface TickerState extends TickerUpdate {
  previousPrice?: number;
  flashDirection?: 'up' | 'down' | null;
  lastUpdated: number;
}

// Statistics for the dashboard
export interface StreamStats {
  totalReceived: number;
  totalRendered: number;
  bufferSize: number;
  coalesced: number; // Updates merged/dropped due to coalescing
  updatesPerSecond: number;
  isThrottling: boolean;
  throttleLevel: number; // 0-1, how much we're throttling
}

// Configuration for the streaming system
export interface StreamConfig {
  updatesPerSecond: number;
  bufferIntervalMs: number;
  throttleThreshold: number; // Buffer size that triggers throttling
  windowSize: number; // Visible rows in virtual list
  rowHeight: number;
  burstEnabled: boolean;
}

// Worker message types
export type WorkerMessage = 
  | { type: 'ready' }
  | { type: 'status'; running: boolean }
  | { type: 'updates'; data: TickerUpdate[]; timestamp: number }
  | { type: 'symbols'; data: TickerUpdate[] }
  | { type: 'configUpdated'; config: Partial<StreamConfig> };

export type WorkerCommand = 
  | { type: 'start' }
  | { type: 'stop' }
  | { type: 'config'; [key: string]: any }
  | { type: 'getSymbols' };
