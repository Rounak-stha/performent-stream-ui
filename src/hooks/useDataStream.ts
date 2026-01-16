import { useCallback, useEffect, useRef, useState } from 'react';
import type { 
  TickerUpdate, 
  TickerState, 
  StreamStats, 
  StreamConfig,
  WorkerMessage,
  WorkerCommand 
} from '@/types/ticker';

/**
 * Custom hook that manages the entire real-time data streaming pipeline
 * 
 * This hook implements four key concepts:
 * 
 * 1. BACKPRESSURE (Flow Control)
 *    - Monitors buffer size and applies throttling when overloaded
 *    - Adaptive throttling: as queue grows, consumption slows down
 *    - Prevents UI from being overwhelmed by data
 * 
 * 2. BUFFERING (Batch Updates)
 *    - Collects updates over configurable intervals (e.g., 50-100ms)
 *    - Applies buffered updates in batches using requestAnimationFrame
 *    - Reduces React re-renders and layout thrashing
 * 
 * 3. COALESCING (Merge Redundant Updates)
 *    - Multiple updates for same symbol in one buffer window = only latest kept
 *    - Uses Map keyed by symbol for O(1) lookup and merge
 *    - Dramatically reduces redundant state updates
 * 
 * 4. WINDOWING (handled by VirtualList component)
 *    - This hook provides all data; VirtualList renders only visible rows
 */

const DEFAULT_CONFIG: StreamConfig = {
  updatesPerSecond: 100,
  bufferIntervalMs: 50,
  throttleThreshold: 500,
  windowSize: 20,
  rowHeight: 48,
  burstEnabled: false
};

export function useDataStream(initialConfig: Partial<StreamConfig> = {}) {
  // Merge initial config with defaults
  const [config, setConfig] = useState<StreamConfig>({ 
    ...DEFAULT_CONFIG, 
    ...initialConfig 
  });
  
  // All ticker data, keyed by symbol
  const [tickers, setTickers] = useState<Map<string, TickerState>>(new Map());
  
  // Stream statistics for dashboard
  const [stats, setStats] = useState<StreamStats>({
    totalReceived: 0,
    totalRendered: 0,
    bufferSize: 0,
    coalesced: 0,
    updatesPerSecond: 0,
    isThrottling: false,
    throttleLevel: 0
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  
  // Refs for mutable state that shouldn't trigger re-renders
  const workerRef = useRef<Worker | null>(null);
  const bufferRef = useRef<Map<string, TickerUpdate>>(new Map());
  const statsRef = useRef({ received: 0, rendered: 0, coalesced: 0 });
  const lastFlushRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const statsIntervalRef = useRef<number | null>(null);
  const receivedInWindowRef = useRef<number>(0);
  
  /**
   * COALESCING IMPLEMENTATION
   * 
   * When an update arrives, we check if we already have a pending update
   * for this symbol in the buffer. If so, we replace it (keeping only latest).
   * This is the core of coalescing - dropping redundant intermediate updates.
   */
  const addToBuffer = useCallback((updates: TickerUpdate[]) => {
    let coalescedCount = 0;
    
    updates.forEach(update => {
      if (bufferRef.current.has(update.symbol)) {
        // This update replaces an existing one = coalesced
        coalescedCount++;
      }
      // Map.set replaces existing entry, keeping only latest
      bufferRef.current.set(update.symbol, update);
    });
    
    statsRef.current.received += updates.length;
    statsRef.current.coalesced += coalescedCount;
    receivedInWindowRef.current += updates.length;
  }, []);
  
  /**
   * BUFFERING + BACKPRESSURE IMPLEMENTATION
   * 
   * This function flushes the buffer to state, applying:
   * - Batching: all buffered updates applied in one setState
   * - Backpressure: if buffer too large, we throttle by skipping frames
   * 
   * Uses requestAnimationFrame for smooth, synchronized updates
   */
  const flushBuffer = useCallback(() => {
    const now = performance.now();
    const bufferSize = bufferRef.current.size;
    
    /**
     * BACKPRESSURE: Adaptive throttling
     * If buffer size exceeds threshold, calculate throttle level
     * and potentially skip this flush cycle
     */
    const throttleLevel = Math.min(1, Math.max(0, 
      (bufferSize - config.throttleThreshold * 0.5) / (config.throttleThreshold * 0.5)
    ));
    
    const isThrottling = bufferSize > config.throttleThreshold * 0.5;
    
    // If heavily throttling, randomly skip some flush cycles
    if (throttleLevel > 0.5 && Math.random() < throttleLevel * 0.5) {
      // Skip this flush to let buffer drain
      rafIdRef.current = requestAnimationFrame(() => {
        setTimeout(flushBuffer, config.bufferIntervalMs);
      });
      return;
    }
    
    // Only flush if enough time has passed (buffer interval)
    if (now - lastFlushRef.current < config.bufferIntervalMs) {
      rafIdRef.current = requestAnimationFrame(() => {
        setTimeout(flushBuffer, config.bufferIntervalMs - (now - lastFlushRef.current));
      });
      return;
    }
    
    // Nothing to flush
    if (bufferSize === 0) {
      rafIdRef.current = requestAnimationFrame(() => {
        setTimeout(flushBuffer, config.bufferIntervalMs);
      });
      return;
    }
    
    lastFlushRef.current = now;
    
    // Get all buffered updates and clear buffer
    const updates = Array.from(bufferRef.current.values());
    bufferRef.current.clear();
    
    statsRef.current.rendered += updates.length;
    
    /**
     * BATCHED STATE UPDATE
     * Single setState call for all updates, preventing multiple re-renders
     */
    setTickers(prevTickers => {
      const newTickers = new Map(prevTickers);
      
      updates.forEach(update => {
        const existing = newTickers.get(update.symbol);
        const previousPrice = existing?.price ?? update.price;
        
        // Determine flash direction for UI feedback
        let flashDirection: 'up' | 'down' | null = null;
        if (update.price > previousPrice) {
          flashDirection = 'up';
        } else if (update.price < previousPrice) {
          flashDirection = 'down';
        }
        
        newTickers.set(update.symbol, {
          ...update,
          previousPrice,
          flashDirection,
          lastUpdated: Date.now()
        });
      });
      
      return newTickers;
    });
    
    // Update stats for UI (throttled to not overwhelm)
    setStats(prev => ({
      ...prev,
      bufferSize,
      isThrottling,
      throttleLevel
    }));
    
    // Schedule next flush
    rafIdRef.current = requestAnimationFrame(() => {
      setTimeout(flushBuffer, config.bufferIntervalMs);
    });
  }, [config.bufferIntervalMs, config.throttleThreshold]);
  
  /**
   * Handle messages from Web Worker
   */
  const handleWorkerMessage = useCallback((event: MessageEvent<WorkerMessage>) => {
    const message = event.data;
    
    switch (message.type) {
      case 'ready':
        setIsWorkerReady(true);
        // Request initial symbols
        workerRef.current?.postMessage({ type: 'getSymbols' });
        break;
        
      case 'status':
        setIsRunning(message.running);
        break;
        
      case 'updates':
        // Add incoming updates to buffer (coalescing happens here)
        addToBuffer(message.data);
        break;
        
      case 'symbols':
        // Initialize tickers with initial data
        const initialTickers = new Map<string, TickerState>();
        message.data.forEach(ticker => {
          initialTickers.set(ticker.symbol, {
            ...ticker,
            lastUpdated: Date.now(),
            flashDirection: null
          });
        });
        setTickers(initialTickers);
        break;
    }
  }, [addToBuffer]);
  
  /**
   * Initialize Web Worker
   */
  useEffect(() => {
    workerRef.current = new Worker('/dataWorker.js');
    workerRef.current.onmessage = handleWorkerMessage;
    
    return () => {
      workerRef.current?.terminate();
    };
  }, [handleWorkerMessage]);
  
  /**
   * Start buffer flush loop when running
   */
  useEffect(() => {
    if (isRunning) {
      flushBuffer();
    }
    
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isRunning, flushBuffer]);
  
  /**
   * Update stats periodically
   */
  useEffect(() => {
    statsIntervalRef.current = window.setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalReceived: statsRef.current.received,
        totalRendered: statsRef.current.rendered,
        coalesced: statsRef.current.coalesced,
        updatesPerSecond: receivedInWindowRef.current
      }));
      receivedInWindowRef.current = 0;
    }, 1000);
    
    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, []);
  
  /**
   * Send config updates to worker
   */
  useEffect(() => {
    if (workerRef.current && isWorkerReady) {
      workerRef.current.postMessage({
        type: 'config',
        updatesPerSecond: config.updatesPerSecond,
        burstEnabled: config.burstEnabled
      });
    }
  }, [config.updatesPerSecond, config.burstEnabled, isWorkerReady]);
  
  // Control functions
  const start = useCallback(() => {
    workerRef.current?.postMessage({ type: 'start' });
  }, []);
  
  const stop = useCallback(() => {
    workerRef.current?.postMessage({ type: 'stop' });
  }, []);
  
  const updateConfig = useCallback((updates: Partial<StreamConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);
  
  const resetStats = useCallback(() => {
    statsRef.current = { received: 0, rendered: 0, coalesced: 0 };
    setStats({
      totalReceived: 0,
      totalRendered: 0,
      bufferSize: 0,
      coalesced: 0,
      updatesPerSecond: 0,
      isThrottling: false,
      throttleLevel: 0
    });
  }, []);
  
  // Clear flash animations after they play
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers(prev => {
        let hasChanges = false;
        const now = Date.now();
        
        prev.forEach((ticker, symbol) => {
          if (ticker.flashDirection && now - ticker.lastUpdated > 600) {
            hasChanges = true;
          }
        });
        
        if (!hasChanges) return prev;
        
        const next = new Map(prev);
        next.forEach((ticker, symbol) => {
          if (ticker.flashDirection && now - ticker.lastUpdated > 600) {
            next.set(symbol, { ...ticker, flashDirection: null });
          }
        });
        return next;
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    tickers: Array.from(tickers.values()).sort((a, b) => a.symbol.localeCompare(b.symbol)),
    stats,
    config,
    isRunning,
    isWorkerReady,
    start,
    stop,
    updateConfig,
    resetStats
  };
}
