/**
 * PURPOSE: Defines the WebSocket message shape carrying ward detail responses to the web client
 *
 * USAGE:
 * wardDetailResponseContract.parse({type: 'ward-detail-response', wardResultId: 'r-1', detail: {...}});
 * // Returns WardDetailResponse with the detail blob (validated separately by ward result contract)
 */

import { z } from '#gateway/npm/zod';
import { wardResultContract } from '@dungeonmaster/shared/contracts';

export const wardDetailResponseContract = z
  .object({
    type: z.literal('ward-detail-response'),
    wardResultId: wardResultContract.shape.id,
    detail: z.json(),
  })
  .brand<'WardDetailResponse'>();

export type WardDetailResponse = z.infer<typeof wardDetailResponseContract>;
