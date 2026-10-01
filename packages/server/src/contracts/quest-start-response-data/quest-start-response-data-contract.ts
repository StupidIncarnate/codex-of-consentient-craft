/**
 * PURPOSE: Defines the `data` QuestStartResponder returns on success
 *
 * USAGE:
 * const data = questStartResponseDataContract.parse(value);
 * // Returns validated QuestStartResponseData
 */

import { z } from '#gateway/npm/zod';
import { orchestrationProcessContract } from '@dungeonmaster/orchestrator/contracts';

export const questStartResponseDataContract = z
  .strictObject({
    processId: orchestrationProcessContract.shape.processId,
    dispatch: z.union([
      z.strictObject({ started: z.boolean() }).brand<'QuestStartResponseDataDispatch'>(),
      z
        .strictObject({
          started: z.boolean(),
          reason: z.string().brand<'QuestStartResponseDataDispatchReason'>(),
        })
        .brand<'QuestStartResponseDataDispatch'>(),
    ]),
  })
  .brand<'QuestStartResponseData'>();

export type QuestStartResponseData = z.infer<typeof questStartResponseDataContract>;
