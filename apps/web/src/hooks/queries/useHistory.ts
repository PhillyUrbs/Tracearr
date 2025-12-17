/**
 * React Query hooks for the History page.
 * Provides infinite scroll queries and filter options.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { HistoryQueryInput } from '@tracearr/shared';
import { api } from '@/lib/api';

/**
 * Filter parameters for history queries.
 * Omits cursor and pageSize as those are handled by infinite query.
 */
export interface HistoryFilters {
  serverUserId?: string;
  serverId?: string;
  state?: 'playing' | 'paused' | 'stopped';
  mediaType?: 'movie' | 'episode' | 'track';
  startDate?: Date;
  endDate?: Date;
  search?: string;
  platform?: string;
  product?: string;
  device?: string;
  playerName?: string;
  ipAddress?: string;
  geoCountry?: string;
  geoCity?: string;
  geoRegion?: string;
  isTranscode?: boolean;
  watched?: boolean;
  excludeShortSessions?: boolean;
  orderBy?: 'startedAt' | 'durationMs' | 'mediaTitle';
  orderDir?: 'asc' | 'desc';
}

/**
 * Infinite query for history sessions with cursor-based pagination.
 * Supports all history filters and provides aggregate stats.
 */
export function useHistorySessions(filters: HistoryFilters = {}, pageSize = 50) {
  return useInfiniteQuery({
    queryKey: ['sessions', 'history', filters, pageSize],
    queryFn: async ({ pageParam }) => {
      const params: Partial<HistoryQueryInput> & { cursor?: string } = {
        ...filters,
        pageSize,
        cursor: pageParam,
      };
      return api.sessions.history(params);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Query for filter options (platforms, products, devices, countries, etc.).
 * Used to populate filter dropdowns.
 */
export function useFilterOptions(serverId?: string) {
  return useQuery({
    queryKey: ['sessions', 'filter-options', serverId],
    queryFn: () => api.sessions.filterOptions(serverId),
    staleTime: 1000 * 60 * 5, // 5 minutes - filter options don't change often
  });
}
