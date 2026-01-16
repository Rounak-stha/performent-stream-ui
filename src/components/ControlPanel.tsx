import React from 'react';
import type { StreamConfig } from '@/types/ticker';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';

/**
 * Control Panel Component
 * 
 * Allows real-time configuration of:
 * - Update rate (updates per second from worker)
 * - Buffer interval (how often to flush to UI)
 * - Throttle threshold (when to start backpressure)
 * - Burst mode toggle (simulate extreme load)
 */

interface ControlPanelProps {
  config: StreamConfig;
  isRunning: boolean;
  onConfigChange: (updates: Partial<StreamConfig>) => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

export function ControlPanel({
  config,
  isRunning,
  onConfigChange,
  onStart,
  onStop,
  onReset
}: ControlPanelProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-6">
        {/* Play/Pause Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={isRunning ? onStop : onStart}
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start
              </>
            )}
          </Button>
          
          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
        
        {/* Update Rate Slider */}
        <div className="flex-1 min-w-48">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Update Rate
            </label>
            <span className="text-sm font-mono text-foreground">
              {config.updatesPerSecond}/sec
            </span>
          </div>
          <Slider
            value={[config.updatesPerSecond]}
            min={10}
            max={500}
            step={10}
            onValueChange={([value]) => onConfigChange({ updatesPerSecond: value })}
            className="control-slider"
          />
        </div>
        
        {/* Buffer Interval Slider */}
        <div className="flex-1 min-w-48">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Buffer Interval
            </label>
            <span className="text-sm font-mono text-foreground">
              {config.bufferIntervalMs}ms
            </span>
          </div>
          <Slider
            value={[config.bufferIntervalMs]}
            min={16}
            max={200}
            step={16}
            onValueChange={([value]) => onConfigChange({ bufferIntervalMs: value })}
            className="control-slider"
          />
        </div>
        
        {/* Throttle Threshold Slider */}
        <div className="flex-1 min-w-48">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">
              Throttle Threshold
            </label>
            <span className="text-sm font-mono text-foreground">
              {config.throttleThreshold}
            </span>
          </div>
          <Slider
            value={[config.throttleThreshold]}
            min={50}
            max={1000}
            step={50}
            onValueChange={([value]) => onConfigChange({ throttleThreshold: value })}
            className="control-slider"
          />
        </div>
        
        {/* Burst Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Extreme Load
            </label>
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${config.burstEnabled ? 'text-[hsl(var(--price-down))]' : 'text-muted-foreground'}`} />
              <Switch
                checked={config.burstEnabled}
                onCheckedChange={(checked) => onConfigChange({ burstEnabled: checked })}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Info Bar */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">Buffering:</strong> Batches updates every {config.bufferIntervalMs}ms
          </span>
          <span>
            <strong className="text-foreground">Coalescing:</strong> Merges duplicate symbol updates
          </span>
          <span>
            <strong className="text-foreground">Backpressure:</strong> Throttles at {config.throttleThreshold} queued items
          </span>
          <span>
            <strong className="text-foreground">Windowing:</strong> Virtual list renders only visible rows
          </span>
        </div>
      </div>
    </div>
  );
}
