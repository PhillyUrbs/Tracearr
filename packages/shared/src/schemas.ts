/**
 * Zod validation schemas for API requests
 */

import { z } from 'zod';

// Common schemas
export const uuidSchema = z.uuid();
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// Auth schemas
export const loginSchema = z.object({
  serverType: z.enum(['plex', 'jellyfin', 'emby']),
  returnUrl: z.url().optional(),
});

export const callbackSchema = z.object({
  code: z.string().optional(),
  token: z.string().optional(),
  serverType: z.enum(['plex', 'jellyfin', 'emby']),
});

// Server schemas
export const createServerSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['plex', 'jellyfin', 'emby']),
  url: z.url(),
  token: z.string().min(1),
});

export const serverIdParamSchema = z.object({
  id: uuidSchema,
});

// User schemas
export const updateUserSchema = z.object({
  allowGuest: z.boolean().optional(),
  trustScore: z.number().int().min(0).max(100).optional(),
});

export const updateUserIdentitySchema = z.object({
  name: z.string().max(255).nullable().optional(),
});

export type UpdateUserIdentityInput = z.infer<typeof updateUserIdentitySchema>;

export const userIdParamSchema = z.object({
  id: uuidSchema,
});

// Session schemas
export const sessionQuerySchema = paginationSchema.extend({
  serverUserId: uuidSchema.optional(),
  serverId: uuidSchema.optional(),
  state: z.enum(['playing', 'paused', 'stopped']).optional(),
  mediaType: z.enum(['movie', 'episode', 'track']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/**
 * Enhanced history query schema with comprehensive filtering for the History page.
 * Supports cursor-based pagination for efficient infinite scroll and
 * all available session fields for filtering.
 */
export const historyQuerySchema = z.object({
  // Pagination - cursor-based for infinite scroll (more efficient than offset for large datasets)
  cursor: z.string().optional(), // Composite: `${startedAt.getTime()}_${playId}`
  pageSize: z.coerce.number().int().positive().max(100).default(50),

  // Existing filters from sessionQuerySchema
  serverUserId: uuidSchema.optional(),
  serverId: uuidSchema.optional(),
  state: z.enum(['playing', 'paused', 'stopped']).optional(),
  mediaType: z.enum(['movie', 'episode', 'track']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  // Title/content search (ILIKE on mediaTitle and grandparentTitle)
  search: z.string().max(200).optional(),

  // Device/client filters
  platform: z.string().max(100).optional(), // Windows, macOS, iOS, Android
  product: z.string().max(255).optional(), // Plex for Windows, Jellyfin Web
  device: z.string().max(255).optional(), // iPhone, Android TV
  playerName: z.string().max(255).optional(), // Device friendly name

  // Network/location filters
  ipAddress: z.string().max(45).optional(), // Exact IP match
  geoCountry: z.string().max(100).optional(), // Country name or code
  geoCity: z.string().max(255).optional(), // City name
  geoRegion: z.string().max(255).optional(), // State/province

  // Stream quality filters
  isTranscode: z.coerce.boolean().optional(), // true = transcode, false = direct play

  // Status filters
  watched: z.coerce.boolean().optional(), // 85%+ completion
  excludeShortSessions: z.coerce.boolean().optional(), // Exclude <120s sessions

  // Sorting
  orderBy: z.enum(['startedAt', 'durationMs', 'mediaTitle']).default('startedAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
});

export const sessionIdParamSchema = z.object({
  id: uuidSchema,
});

// Session termination schema
export const terminateSessionBodySchema = z.object({
  /** Optional message to display to user (Plex only, ignored by Jellyfin/Emby) */
  reason: z.string().max(500).optional(),
});

// Rule schemas
export const impossibleTravelParamsSchema = z.object({
  maxSpeedKmh: z.number().positive().default(500),
  ignoreVpnRanges: z.boolean().optional(),
});

export const simultaneousLocationsParamsSchema = z.object({
  minDistanceKm: z.number().positive().default(100),
});

export const deviceVelocityParamsSchema = z.object({
  maxIps: z.number().int().positive().default(5),
  windowHours: z.number().int().positive().default(24),
});

export const concurrentStreamsParamsSchema = z.object({
  maxStreams: z.number().int().positive().default(3),
});

export const geoRestrictionParamsSchema = z.object({
  mode: z.enum(['blocklist', 'allowlist']).default('blocklist'),
  countries: z.array(z.string().length(2)).default([]),
});

export const ruleParamsSchema = z.union([
  impossibleTravelParamsSchema,
  simultaneousLocationsParamsSchema,
  deviceVelocityParamsSchema,
  concurrentStreamsParamsSchema,
  geoRestrictionParamsSchema,
]);

export const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    'impossible_travel',
    'simultaneous_locations',
    'device_velocity',
    'concurrent_streams',
    'geo_restriction',
  ]),
  params: z.record(z.string(), z.unknown()),
  serverUserId: uuidSchema.nullable().default(null),
  isActive: z.boolean().default(true),
});

export const updateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const ruleIdParamSchema = z.object({
  id: uuidSchema,
});

// Violation schemas
export const violationQuerySchema = paginationSchema.extend({
  serverId: uuidSchema.optional(),
  serverUserId: uuidSchema.optional(),
  ruleId: uuidSchema.optional(),
  severity: z.enum(['low', 'warning', 'high']).optional(),
  acknowledged: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const violationIdParamSchema = z.object({
  id: uuidSchema,
});

// Stats schemas
export const serverIdFilterSchema = z.object({
  serverId: uuidSchema.optional(),
});

export const statsQuerySchema = z
  .object({
    period: z.enum(['day', 'week', 'month', 'year', 'all', 'custom']).default('week'),
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().optional(),
    serverId: uuidSchema.optional(),
  })
  .refine(
    (data) => {
      // Custom period requires both dates
      if (data.period === 'custom') {
        return data.startDate && data.endDate;
      }
      return true;
    },
    { message: 'Custom period requires startDate and endDate' }
  )
  .refine(
    (data) => {
      // If dates provided, start must be before end
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    { message: 'startDate must be before endDate' }
  );

// Location stats with full filtering - uses same period system as statsQuerySchema
export const locationStatsQuerySchema = z
  .object({
    period: z.enum(['day', 'week', 'month', 'year', 'all', 'custom']).default('month'),
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().optional(),
    serverUserId: uuidSchema.optional(),
    serverId: uuidSchema.optional(),
    mediaType: z.enum(['movie', 'episode', 'track']).optional(),
  })
  .refine(
    (data) => {
      if (data.period === 'custom') {
        return data.startDate && data.endDate;
      }
      return true;
    },
    { message: 'Custom period requires startDate and endDate' }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    { message: 'startDate must be before endDate' }
  );

// Webhook format enum
export const webhookFormatSchema = z.enum(['json', 'ntfy', 'apprise']);

// Unit system enum for display preferences
export const unitSystemSchema = z.enum(['metric', 'imperial']);

// Settings schemas
export const updateSettingsSchema = z.object({
  allowGuestAccess: z.boolean().optional(),
  // Display preferences
  unitSystem: unitSystemSchema.optional(),
  discordWebhookUrl: z.url().nullable().optional(),
  customWebhookUrl: z.url().nullable().optional(),
  webhookFormat: webhookFormatSchema.nullable().optional(),
  ntfyTopic: z.string().max(200).nullable().optional(),
  ntfyAuthToken: z.string().max(500).nullable().optional(),
  // Poller settings
  pollerEnabled: z.boolean().optional(),
  pollerIntervalMs: z.number().int().min(5000).max(300000).optional(),
  // Tautulli integration
  tautulliUrl: z.url().nullable().optional(),
  tautulliApiKey: z.string().nullable().optional(),
  // Network/access settings
  externalUrl: z.url().nullable().optional(),
  basePath: z.string().max(100).optional(),
  trustProxy: z.boolean().optional(),
  // Authentication settings
  primaryAuthMethod: z.enum(['jellyfin', 'local']).optional(),
});

// Tautulli import schemas
export const tautulliImportSchema = z.object({
  serverId: uuidSchema, // Which Tracearr server to import into
});

// Type exports from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type CallbackInput = z.infer<typeof callbackSchema>;
export type CreateServerInput = z.infer<typeof createServerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SessionQueryInput = z.infer<typeof sessionQuerySchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
export type ViolationQueryInput = z.infer<typeof violationQuerySchema>;
export type ServerIdFilterInput = z.infer<typeof serverIdFilterSchema>;
export type StatsQueryInput = z.infer<typeof statsQuerySchema>;
export type LocationStatsQueryInput = z.infer<typeof locationStatsQuerySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type TautulliImportInput = z.infer<typeof tautulliImportSchema>;
