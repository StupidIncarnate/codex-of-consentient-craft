/**
 * PURPOSE: Defines the WebSocket message shape carrying ward detail responses to the web client
 *
 * USAGE:
 * wardDetailResponseContract.parse({type: 'ward-detail-response', wardResultId: 'r-1', detail: {...}});
 * // Returns WardDetailResponse with the detail blob (validated separately by ward result contract)
 */

import { z } from 'zod';

export const wardDetailResponseContract = z.object({
  type: z.literal('ward-detail-response'),
  wardResultId: z.string().uuid().brand<'WardResultId'>(),
  detail: z.unknown(),
});

export type WardDetailResponse = z.infer<typeof wardDetailResponseContract>;
