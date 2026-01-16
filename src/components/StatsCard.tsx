import React from 'react';
import type { StreamStats } from '@/types/ticker';
import { Activity, Database, Layers, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Statistics Dashboard Card
 * 
 * Displays real-time metrics about the streaming pipeline:
 * - Total updates received from worker
 * - Updates actually rendered to screen
 * - Current buffer size
 * - Coalesced (merged) updates
 * - Updates per second throughput
 * - Throttling status
 */

interface StatsCardProps {
  stats: StreamStats;
}

export function StatsCard({ stats }: StatsCardProps) {
  const efficiency = stats.totalReceived > 0 
    ? ((stats.totalRendered / stats.totalReceived) * 100).toFixed(1)
    : '100.0';
    
  const coalesceRate = stats.totalReceived > 0 
    ? ((stats.coalesced / stats.totalReceived) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Updates Received */}
      <div className="stats-card">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Received</span>
        </div>
        <div className="text-2xl font-bold tabular-nums text-foreground">
          {stats.totalReceived.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {stats.updatesPerSecond.toLocaleString()}/sec
        </div>
      </div>
      
      {/* Updates Rendered */}
      <div className="stats-card">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Rendered</span>
        </div>
        <div className="text-2xl font-bold tabular-nums text-foreground">
          {stats.totalRendered.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {efficiency}% efficiency
        </div>
      </div>
      
      {/* Buffer Size */}
      <div className={`stats-card ${
        stats.bufferSize > 100 ? 'stats-card-warning' : 'stats-card-healthy'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Buffer</span>
        </div>
        <div className="text-2xl font-bold tabular-nums text-foreground">
          {stats.bufferSize}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          pending items
        </div>
      </div>
      
      {/* Coalesced Updates */}
      <div className="stats-card">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Coalesced</span>
        </div>
        <div className="text-2xl font-bold tabular-nums text-foreground">
          {stats.coalesced.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {coalesceRate}% merged
        </div>
      </div>
      
      {/* Throughput */}
      <div className="stats-card">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Rate</span>
        </div>
        <div className="text-2xl font-bold tabular-nums text-foreground">
          {(stats.updatesPerSecond * 60 / 1000).toFixed(1)}K
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          updates/min
        </div>
      </div>
      
      {/* Throttling Status */}
      <div className={`stats-card ${
        stats.isThrottling ? 'stats-card-warning' : 'stats-card-healthy'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {stats.isThrottling ? (
            <AlertTriangle className="w-4 h-4 text-[hsl(var(--price-down))]" />
          ) : (
            <CheckCircle className="w-4 h-4 text-[hsl(var(--price-up))]" />
          )}
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
        </div>
        <div className={`text-lg font-bold ${
          stats.isThrottling ? 'text-[hsl(var(--price-down))]' : 'text-[hsl(var(--price-up))]'
        }`}>
          {stats.isThrottling ? 'THROTTLING' : 'NOMINAL'}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {(stats.throttleLevel * 100).toFixed(0)}% pressure
        </div>
      </div>
    </div>
  );
}
