import { Server } from 'lucide-react';
import { useServer } from '@/hooks/useServer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export function ServerSelector() {
  const { servers, selectedServerId, selectServer, isLoading } = useServer();

  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (servers.length === 0) {
    return null;
  }

  // Only show selector if there are multiple servers
  if (servers.length === 1) {
    const server = servers[0]!;
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Server className="h-4 w-4" />
        <span className="truncate font-medium">{server.name}</span>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <Select value={selectedServerId ?? undefined} onValueChange={selectServer}>
        <SelectTrigger className="h-9 w-full">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
            <SelectValue placeholder="Select server" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {servers.map((server) => (
            <SelectItem key={server.id} value={server.id}>
              <span className="truncate">{server.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
