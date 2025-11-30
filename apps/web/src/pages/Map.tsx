import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StreamMap } from '@/components/map';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, RotateCcw } from 'lucide-react';
import { useLocationStats, useUsers, useServers } from '@/hooks/queries';

const TIME_RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'All time' },
] as const;

const MEDIA_TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'movie', label: 'Movies' },
  { value: 'episode', label: 'TV Shows' },
  { value: 'track', label: 'Music' },
] as const;

export function Map() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL
  const filters = useMemo(() => ({
    days: Number(searchParams.get('days')) || 30,
    userId: searchParams.get('userId') || undefined,
    serverId: searchParams.get('serverId') || undefined,
    mediaType: (searchParams.get('mediaType') as 'movie' | 'episode' | 'track') || undefined,
  }), [searchParams]);

  // Fetch data
  const { data: locationData, isLoading } = useLocationStats(filters);
  const { data: usersData } = useUsers({ pageSize: 100 });
  const { data: serversData } = useServers();

  const users = usersData?.data ?? [];
  const servers = serversData ?? [];
  const locations = locationData?.data ?? [];
  const summary = locationData?.summary;

  // Check if any filters are active
  const hasActiveFilters = filters.userId || filters.serverId || filters.mediaType || filters.days !== 30;

  // Update filter in URL
  const updateFilter = (key: string, value: string | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Build context label for stats card
  const contextLabel = useMemo(() => {
    const parts: string[] = [];

    if (filters.userId) {
      const user = users.find(u => u.id === filters.userId);
      if (user) parts.push(user.username);
    }

    if (filters.serverId) {
      const server = servers.find(s => s.id === filters.serverId);
      if (server) parts.push(server.name);
    }

    if (filters.mediaType) {
      const label = MEDIA_TYPE_OPTIONS.find(o => o.value === filters.mediaType)?.label;
      if (label) parts.push(label);
    }

    return parts.length > 0 ? parts.join(' · ') : null;
  }, [filters, users, servers]);

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      {/* Filter bar */}
      <div className="absolute left-4 right-4 top-4 z-[1000] flex items-center gap-2 rounded-lg border bg-card/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        {/* User filter */}
        <Select
          value={filters.userId ?? 'all'}
          onValueChange={(value) => updateFilter('userId', value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-[160px] bg-background">
            <SelectValue placeholder="All users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Server filter */}
        <Select
          value={filters.serverId ?? 'all'}
          onValueChange={(value) => updateFilter('serverId', value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-[160px] bg-background">
            <SelectValue placeholder="All servers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All servers</SelectItem>
            {servers.map((server) => (
              <SelectItem key={server.id} value={server.id}>
                {server.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Media type filter */}
        <Select
          value={filters.mediaType ?? 'all'}
          onValueChange={(value) => updateFilter('mediaType', value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            {MEDIA_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Time range filter */}
        <Select
          value={String(filters.days)}
          onValueChange={(value) => updateFilter('days', value === '30' ? undefined : value)}
        >
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Last 30 days" />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Stats overlay card */}
      <Card className="absolute bottom-6 left-4 z-[1000] w-[200px] bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <CardContent className="p-4">
          {contextLabel && (
            <p className="mb-2 text-xs font-medium text-muted-foreground truncate">
              {contextLabel}
            </p>
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums">
              {summary?.totalStreams ?? 0}
            </span>
            <span className="text-sm text-muted-foreground">streams</span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{summary?.uniqueLocations ?? 0} locations</span>
          </div>

          {summary?.topCity && (
            <p className="mt-1 text-xs text-muted-foreground">
              Top: {summary.topCity}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Full-height map */}
      <StreamMap
        locations={locations}
        isLoading={isLoading}
        className="h-full"
      />
    </div>
  );
}
