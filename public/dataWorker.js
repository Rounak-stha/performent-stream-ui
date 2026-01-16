/**
 * Data Simulation Web Worker
 * 
 * This worker acts as a high-throughput "API" that generates thousands of 
 * random stock ticker updates per minute. It simulates real-world scenarios
 * where data arrives faster than the UI can render.
 * 
 * KEY CONCEPTS:
 * - Decoupled from main thread to prevent UI blocking
 * - Configurable update rate to simulate various load conditions
 * - Bursty traffic simulation for realistic testing
 */

// Stock symbols to simulate
const SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'TSLA', 'JPM', 'V', 'JNJ',
  'WMT', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL', 'ADBE', 'NFLX', 'CRM',
  'INTC', 'CSCO', 'PEP', 'TMO', 'ABT', 'COST', 'AVGO', 'ACN', 'MRK', 'NKE',
  'DHR', 'TXN', 'QCOM', 'LLY', 'MDT', 'NEE', 'UNP', 'PM', 'HON', 'RTX',
  'BMY', 'LOW', 'ORCL', 'AMGN', 'IBM', 'GE', 'CAT', 'BA', 'MMM', 'GS',
  'SBUX', 'BLK', 'ISRG', 'GILD', 'CVS', 'ZTS', 'MDLZ', 'ADP', 'TGT', 'BKNG',
  'SPGI', 'CB', 'MO', 'COP', 'USB', 'PNC', 'CI', 'TJX', 'MS', 'DE',
  'AMD', 'MU', 'SQ', 'SNOW', 'UBER', 'ABNB', 'COIN', 'RBLX', 'PLTR', 'RIVN',
  'LCID', 'SOFI', 'HOOD', 'DKNG', 'ROKU', 'ZM', 'DOCU', 'CRWD', 'NET', 'DDOG',
  'OKTA', 'TWLO', 'SNAP', 'PINS', 'TTD', 'UNITY', 'U', 'BILL', 'MNDY', 'AFRM'
];

// Initial prices for each symbol
const prices = {};
const volumes = {};

// Initialize prices between $50 and $500
SYMBOLS.forEach(symbol => {
  prices[symbol] = Math.random() * 450 + 50;
  volumes[symbol] = Math.floor(Math.random() * 1000000) + 100000;
});

let isRunning = false;
let updateInterval = null;
let config = {
  updatesPerSecond: 100, // Default: 100 updates per second = 6000/min
  burstEnabled: false,
  burstMultiplier: 3
};

/**
 * Generate a single random update for a stock
 * Simulates realistic price movements with small random changes
 */
function generateUpdate(symbol) {
  // Random price change between -2% and +2%
  const priceChange = (Math.random() - 0.5) * 0.04;
  prices[symbol] *= (1 + priceChange);
  
  // Clamp price to reasonable bounds
  prices[symbol] = Math.max(1, Math.min(10000, prices[symbol]));
  
  // Random volume change
  volumes[symbol] = Math.floor(volumes[symbol] * (0.95 + Math.random() * 0.1));
  
  return {
    symbol,
    price: prices[symbol],
    change: priceChange * 100, // Percentage change
    volume: volumes[symbol],
    timestamp: Date.now(),
    id: `${symbol}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Generate a batch of updates
 * Randomly selects symbols to update, simulating real market behavior
 * where not all stocks update simultaneously
 */
function generateBatch(count) {
  const updates = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * SYMBOLS.length);
    updates.push(generateUpdate(SYMBOLS[randomIndex]));
  }
  return updates;
}

/**
 * Start the update loop
 * Uses setInterval to emit batches at configured rate
 */
function startUpdates() {
  if (isRunning) return;
  isRunning = true;
  
  // Calculate batch size and interval for smooth distribution
  // We emit batches every 10ms to spread load evenly
  const batchInterval = 10; // 10ms between batches
  const batchesPerSecond = 1000 / batchInterval;
  
  updateInterval = setInterval(() => {
    const effectiveRate = config.burstEnabled 
      ? config.updatesPerSecond * config.burstMultiplier 
      : config.updatesPerSecond;
    
    const batchSize = Math.ceil(effectiveRate / batchesPerSecond);
    const updates = generateBatch(batchSize);
    
    // Send updates to main thread via postMessage
    self.postMessage({
      type: 'updates',
      data: updates,
      timestamp: Date.now()
    });
  }, batchInterval);
  
  self.postMessage({ type: 'status', running: true });
}

/**
 * Stop the update loop
 */
function stopUpdates() {
  if (!isRunning) return;
  isRunning = false;
  
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
  
  self.postMessage({ type: 'status', running: false });
}

/**
 * Handle messages from main thread
 */
self.onmessage = function(event) {
  const { type, ...params } = event.data;
  
  switch (type) {
    case 'start':
      startUpdates();
      break;
      
    case 'stop':
      stopUpdates();
      break;
      
    case 'config':
      // Update configuration
      config = { ...config, ...params };
      self.postMessage({ type: 'configUpdated', config });
      break;
      
    case 'getSymbols':
      // Return list of all symbols for initial render
      self.postMessage({
        type: 'symbols',
        data: SYMBOLS.map(symbol => ({
          symbol,
          price: prices[symbol],
          change: 0,
          volume: volumes[symbol],
          timestamp: Date.now()
        }))
      });
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
};

// Signal that worker is ready
self.postMessage({ type: 'ready' });
