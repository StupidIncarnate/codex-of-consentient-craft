/**
 * PURPOSE: Defines the shape of a pending HTTP request during MSW capture before the response arrives
 *
 * USAGE:
 * import type { PendingRequest } from './pending-request-contract';
 * // Type-safe in-flight request tracking
 */

import { z } from 'zod';

export const pendingRequestContract = z.object({
  method: z.string().brand<'HttpMethod'>(),
  url: z.string().brand<'RequestUrl'>(),
  timestampMs: z.number().nonnegative().brand<'EpochTimestamp'>(),
  requestBody: z.string().brand<'RequestBody'>().optional(),
});

export type PendingRequest = z.infer<typeof pendingRequestContract>;
