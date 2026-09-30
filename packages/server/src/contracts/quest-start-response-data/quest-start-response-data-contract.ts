/**
 * PURPOSE: Defines the `data` QuestStartResponder returns on success
 *
 * USAGE:
 * const data = questStartResponseDataContract.parse(value);
 * // Returns validated QuestStartResponseData
 */

import { z } from '#gateway/npm/zod';

export const questStartResponseDataContract = z
  .strictObject({
    processId: z.string(),
    dispatch: z.union([
      z.strictObject({ started: z.boolean() }).brand<'QuestStartResponseDataDispatch'>(),
      z.strictObject({ started: z.boolean(), reason: z.string() }).brand<'QuestStartResponseDataDispatch'>(),
    ]),
  })
  .brand<'QuestStartResponseData'>();

export type QuestStartResponseData = z.infer<typeof questStartResponseDataContract>;
