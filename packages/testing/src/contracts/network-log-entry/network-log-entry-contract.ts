/**
 * PURPOSE: Zod schema for HTTP request/response log entry used in network recording
 *
 * USAGE:
 * networkLogEntryContract.parse({method: 'GET', url: '/api/guilds', status: 200, source: 'mock'});
 * // Returns validated NetworkLogEntry type
 */

import { z } from '#gateway/npm/zod';

export const networkLogEntryContract = z
  .object({
    method: z.string().brand<'NetworkLogEntryMethod'>(),
    url: z.string().brand<'NetworkLogEntryUrl'>(),
    status: z.number().int().brand<'NetworkLogEntryStatus'>().optional(),
    durationMs: z.number().nonnegative().brand<'NetworkLogEntryDurationMs'>().optional(),
    requestBody: z.string().brand<'NetworkLogEntryRequestBody'>().optional(),
    responseBody: z.string().brand<'NetworkLogEntryResponseBody'>().optional(),
    error: z.string().brand<'NetworkLogEntryError'>().optional(),
    source: z.enum(['mock', 'bypass', 'browser']),
  })
  .brand<'NetworkLogEntry'>();

export type NetworkLogEntry = z.infer<typeof networkLogEntryContract>;
