/**
 * PURPOSE: Defines the HTTP response shape for the quest modify endpoint as consumed by the web client
 *
 * USAGE:
 * questModifyResponseContract.parse({success: true});
 * // Returns QuestModifyResponse — either {success: true} or {success: false, error: '...'}
 */

import { z } from '#gateway/npm/zod';

export const questModifyResponseContract = z.union([
  z.object({ success: z.literal(true) }).brand<'QuestModifyResponse'>(),
  z.object({
    success: z.literal(false),
    error: z.string().min(1).brand<'QuestModifyResponseError'>().optional(),
  }).brand<'QuestModifyResponse'>(),
]);

export type QuestModifyResponse = z.infer<typeof questModifyResponseContract>;
