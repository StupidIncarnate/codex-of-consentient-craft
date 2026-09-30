/**
 * PURPOSE: Defines the shape of a pending HTTP request during MSW capture before the response arrives
 *
 * USAGE:
 * import type { PendingRequest } from './pending-request-contract';
 * // Type-safe in-flight request tracking
 */

import { z } from '#gateway/npm/zod';

export const pendingRequestContract = z.object({
  method: z.string().brand<'PendingRequestMethod'>(),
  url: z.string().brand<'PendingRequestUrl'>(),
  timestampMs: z.number().nonnegative().brand<'PendingRequestTimestampMs'>(),
  requestBody: z.string().brand<'PendingRequestRequestBody'>().optional(),
}).brand<'PendingRequest'>();

export type PendingRequest = z.infer<typeof pendingRequestContract>;
