/**
 * Table component for displaying history sessions.
 * Features columns for all session data, supports infinite scroll and column visibility.
 */

import { forwardRef } from 'react';
import { Link } from 'react-router';
import {
  Film,
  Tv,
  Music,
  Play,
  Pause,
  Square,
  MonitorPlay,
  Repeat2,
  Globe,
  Clock,
  Eye,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/components/users/utils';
import type { SessionWithDetails, SessionState, MediaType } from '@tracearr/shared';
import type { ColumnVisibility } from './HistoryFilters';
import { format } from 'date-fns';

interface Props {
  sessions: SessionWithDetails[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  onSessionClick?: (session: SessionWithDetails) => void;
  columnVisibility: ColumnVisibility;
}

// State icon component
function StateIcon({ state }: { state: SessionState }) {
  const config: Record<SessionState, { icon: typeof Play; color: string; label: string }> = {
    playing: { icon: Play, color: 'text-green-500', label: 'Playing' },
    paused: { icon: Pause, color: 'text-yellow-500', label: 'Paused' },
    stopped: { icon: Square, color: 'text-muted-foreground', label: 'Stopped' },
  };
  const { icon: Icon, color, label } = config[state];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Icon className={cn('h-4 w-4', color)} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

// Media type icon component
function MediaTypeIcon({ type }: { type: MediaType }) {
  const config: Record<MediaType, { icon: typeof Film; label: string }> = {
    movie: { icon: Film, label: 'Movie' },
    episode: { icon: Tv, label: 'TV Episode' },
    track: { icon: Music, label: 'Music' },
  };
  const { icon: Icon, label } = config[type];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

// Format duration in human readable format
function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// Calculate progress percentage
function getProgress(session: SessionWithDetails): number {
  if (!session.totalDurationMs || session.totalDurationMs === 0) return 0;
  const progress = session.progressMs ?? session.durationMs ?? 0;
  return Math.min(100, Math.round((progress / session.totalDurationMs) * 100));
}

// Get formatted content title
function getContentTitle(session: SessionWithDetails): { primary: string; secondary?: string } {
  if (session.mediaType === 'episode' && session.grandparentTitle) {
    const epNum = session.seasonNumber && session.episodeNumber
      ? `S${session.seasonNumber.toString().padStart(2, '0')}E${session.episodeNumber.toString().padStart(2, '0')}`
      : '';
    return {
      primary: session.grandparentTitle,
      secondary: `${epNum}${epNum ? ' · ' : ''}${session.mediaTitle}`,
    };
  }
  return {
    primary: session.mediaTitle,
    secondary: session.year ? `(${session.year})` : undefined,
  };
}

// Session row component with column visibility support
export const HistoryTableRow = forwardRef<
  HTMLTableRowElement,
  { session: SessionWithDetails; onClick?: () => void; columnVisibility: ColumnVisibility }
>(({ session, onClick, columnVisibility }, ref) => {
  const title = getContentTitle(session);
  const progress = getProgress(session);

  return (
    <TableRow
      ref={ref}
      className={cn('cursor-pointer transition-colors', onClick && 'hover:bg-muted/50')}
      onClick={onClick}
    >
      {/* Date/Time with State */}
      {columnVisibility.date && (
        <TableCell className="w-[140px]">
          <div className="flex items-center gap-2">
            <StateIcon state={session.state} />
            <div>
              <div className="text-sm font-medium">
                {format(new Date(session.startedAt), 'MMM d, yyyy')}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(session.startedAt), 'h:mm a')}
              </div>
            </div>
          </div>
        </TableCell>
      )}

      {/* User */}
      {columnVisibility.user && (
        <TableCell className="w-[150px]">
          <Link
            to={`/users/${session.serverUserId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 hover:underline"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={getAvatarUrl(session.serverId, session.user.thumbUrl, 24) ?? undefined} />
              <AvatarFallback className="text-xs">
                {(session.user.identityName ?? session.user.username)?.[0]?.toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <span className="truncate text-sm block">{session.user.identityName ?? session.user.username}</span>
              {session.user.identityName && session.user.identityName !== session.user.username && (
                <span className="truncate text-xs text-muted-foreground block">@{session.user.username}</span>
              )}
            </div>
          </Link>
        </TableCell>
      )}

      {/* Content */}
      {columnVisibility.content && (
        <TableCell className="min-w-[200px] max-w-[300px]">
          <div className="flex items-center gap-2">
            <MediaTypeIcon type={session.mediaType} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{title.primary}</span>
                {session.watched && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Eye className="h-3.5 w-3.5 text-green-500" />
                    </TooltipTrigger>
                    <TooltipContent>Watched</TooltipContent>
                  </Tooltip>
                )}
              </div>
              {title.secondary && (
                <div className="truncate text-xs text-muted-foreground">
                  {title.secondary}
                </div>
              )}
            </div>
          </div>
        </TableCell>
      )}

      {/* Platform/Device */}
      {columnVisibility.platform && (
        <TableCell className="w-[120px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <div className="truncate text-sm">{session.platform ?? '—'}</div>
                {session.product && (
                  <div className="truncate text-xs text-muted-foreground">
                    {session.product}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                {session.platform && <div>Platform: {session.platform}</div>}
                {session.product && <div>Product: {session.product}</div>}
                {session.device && <div>Device: {session.device}</div>}
                {session.playerName && <div>Player: {session.playerName}</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TableCell>
      )}

      {/* Location */}
      {columnVisibility.location && (
        <TableCell className="w-[130px]">
          {session.geoCity || session.geoCountry ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate text-sm">
                    {session.geoCity || session.geoCountry}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 text-xs">
                  {session.geoCity && <div>City: {session.geoCity}</div>}
                  {session.geoRegion && <div>Region: {session.geoRegion}</div>}
                  {session.geoCountry && <div>Country: {session.geoCountry}</div>}
                  {session.ipAddress && <div>IP: {session.ipAddress}</div>}
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
      )}

      {/* Quality */}
      {columnVisibility.quality && (
        <TableCell className="w-[100px]">
          <Badge
            variant={session.isTranscode ? 'warning' : 'secondary'}
            className="gap-1 text-xs"
          >
            {session.isTranscode ? (
              <>
                <Repeat2 className="h-3 w-3" />
                Transcode
              </>
            ) : session.videoDecision === 'copy' || session.audioDecision === 'copy' ? (
              <>
                <MonitorPlay className="h-3 w-3" />
                Direct Stream
              </>
            ) : (
              <>
                <MonitorPlay className="h-3 w-3" />
                Direct Play
              </>
            )}
          </Badge>
        </TableCell>
      )}

      {/* Duration */}
      {columnVisibility.duration && (
        <TableCell className="w-[90px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{formatDuration(session.durationMs)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <div>Watch time: {formatDuration(session.durationMs)}</div>
                {session.pausedDurationMs > 0 && (
                  <div>Paused: {formatDuration(session.pausedDurationMs)}</div>
                )}
                {session.totalDurationMs && (
                  <div>Media length: {formatDuration(session.totalDurationMs)}</div>
                )}
                {session.segmentCount && session.segmentCount > 1 && (
                  <div>Segments: {session.segmentCount}</div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TableCell>
      )}

      {/* Progress */}
      {columnVisibility.progress && (
        <TableCell className="w-[80px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="h-1.5 w-12" />
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {progress}% complete
              {session.watched && ' (watched)'}
            </TooltipContent>
          </Tooltip>
        </TableCell>
      )}
    </TableRow>
  );
});
HistoryTableRow.displayName = 'HistoryTableRow';

// Loading skeleton row with column visibility support
function SkeletonRow({ columnVisibility }: { columnVisibility: ColumnVisibility }) {
  return (
    <TableRow>
      {columnVisibility.date && (
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        </TableCell>
      )}
      {columnVisibility.user && (
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </TableCell>
      )}
      {columnVisibility.content && (
        <TableCell>
          <div className="space-y-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </TableCell>
      )}
      {columnVisibility.platform && (
        <TableCell>
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </TableCell>
      )}
      {columnVisibility.location && (
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
      )}
      {columnVisibility.quality && (
        <TableCell>
          <Skeleton className="h-5 w-20 rounded-full" />
        </TableCell>
      )}
      {columnVisibility.duration && (
        <TableCell>
          <Skeleton className="h-4 w-14" />
        </TableCell>
      )}
      {columnVisibility.progress && (
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="h-1.5 w-12" />
            <Skeleton className="h-3 w-8" />
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

// Count visible columns for empty state colspan
function getVisibleColumnCount(columnVisibility: ColumnVisibility): number {
  return Object.values(columnVisibility).filter(Boolean).length;
}

export function HistoryTable({
  sessions,
  isLoading,
  isFetchingNextPage,
  onSessionClick,
  columnVisibility,
}: Props) {
  const visibleColumnCount = getVisibleColumnCount(columnVisibility);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columnVisibility.date && <TableHead>Date</TableHead>}
          {columnVisibility.user && <TableHead>User</TableHead>}
          {columnVisibility.content && <TableHead>Content</TableHead>}
          {columnVisibility.platform && <TableHead>Platform</TableHead>}
          {columnVisibility.location && <TableHead>Location</TableHead>}
          {columnVisibility.quality && <TableHead>Quality</TableHead>}
          {columnVisibility.duration && <TableHead>Duration</TableHead>}
          {columnVisibility.progress && <TableHead>Progress</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          // Show skeleton rows when loading initially
          Array.from({ length: 10 }).map((_, i) => (
            <SkeletonRow key={i} columnVisibility={columnVisibility} />
          ))
        ) : sessions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={visibleColumnCount} className="h-32 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Clock className="h-8 w-8" />
                <p>No sessions found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          <>
            {sessions.map((session) => (
              <HistoryTableRow
                key={`${session.startedAt}_${session.id}`}
                session={session}
                onClick={onSessionClick ? () => onSessionClick(session) : undefined}
                columnVisibility={columnVisibility}
              />
            ))}
            {/* Show skeleton rows when fetching next page */}
            {isFetchingNextPage &&
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={`loading-${i}`} columnVisibility={columnVisibility} />
              ))}
          </>
        )}
      </TableBody>
    </Table>
  );
}
