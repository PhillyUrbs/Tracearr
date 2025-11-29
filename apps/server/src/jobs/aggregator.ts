/**
 * Background job for refreshing dashboard statistics
 */

import { POLLING_INTERVALS } from '@tracearr/shared';

let aggregatorInterval: NodeJS.Timeout | null = null;

export interface AggregatorConfig {
  enabled: boolean;
  intervalMs: number;
}

const defaultConfig: AggregatorConfig = {
  enabled: true,
  intervalMs: POLLING_INTERVALS.STATS_REFRESH,
};

/**
 * Refresh dashboard statistics and cache them
 */
async function refreshStats(): Promise<void> {
  try {
    // 1. Query active stream count
    // 2. Query today's play count
    // 3. Query watch time for period
    // 4. Query violation count for last 24h
    // 5. Cache results in Redis with TTL
    // 6. Broadcast stats update via WebSocket

    console.log('Refreshing dashboard statistics...');
  } catch (error) {
    console.error('Stats aggregation error:', error);
  }
}

/**
 * Start the aggregator job
 */
export function startAggregator(config: Partial<AggregatorConfig> = {}): void {
  const mergedConfig = { ...defaultConfig, ...config };

  if (!mergedConfig.enabled) {
    console.log('Stats aggregator disabled');
    return;
  }

  if (aggregatorInterval) {
    console.log('Aggregator already running');
    return;
  }

  console.log(`Starting stats aggregator with ${mergedConfig.intervalMs}ms interval`);

  // Run immediately on start
  void refreshStats();

  // Then run on interval
  aggregatorInterval = setInterval(() => void refreshStats(), mergedConfig.intervalMs);
}

/**
 * Stop the aggregator job
 */
export function stopAggregator(): void {
  if (aggregatorInterval) {
    clearInterval(aggregatorInterval);
    aggregatorInterval = null;
    console.log('Stats aggregator stopped');
  }
}

/**
 * Force an immediate stats refresh
 */
export async function triggerRefresh(): Promise<void> {
  await refreshStats();
}
