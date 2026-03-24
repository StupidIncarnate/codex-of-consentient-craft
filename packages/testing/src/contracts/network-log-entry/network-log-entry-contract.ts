/**
 * PURPOSE: Zod schema for HTTP request/response log entry used in network recording
 *
 * USAGE:
 * networkLogEntryContract.parse({method: 'GET', url: '/api/guilds', status: 200, source: 'mock'});
 * // Returns validated NetworkLogEntry type
 */

import { z } from 'zod';

export const networkLogEntryContract = z.object({
  method: z.string().brand<'HttpMethod'>(),
  url: z.string().brand<'RequestUrl'>(),
  status: z.number().int().brand<'HttpStatus'>().optional(),
  durationMs: z.number().nonnegative().brand<'DurationMs'>().optional(),
  requestBody: z.string().brand<'RequestBody'>().optional(),
  responseBody: z.string().brand<'ResponseBody'>().optional(),
  error: z.string().brand<'NetworkError'>().optional(),
  source: z.enum(['mock', 'bypass', 'browser']),
});

export type NetworkLogEntry = z.infer<typeof networkLogEntryContract>;
