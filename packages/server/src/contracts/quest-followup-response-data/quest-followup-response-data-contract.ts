/**
 * PURPOSE: Defines the `data` QuestFollowupResponder returns on success
 *
 * USAGE:
 * const data = questFollowupResponseDataContract.parse(value);
 * // Returns validated QuestFollowupResponseData
 */

import { z } from '#gateway/npm/zod';
import { orchestrationProcessContract } from '@dungeonmaster/orchestrator/contracts';

export const questFollowupResponseDataContract = z
  .strictObject({ chatProcessId: orchestrationProcessContract.shape.processId })
  .brand<'QuestFollowupResponseData'>();

export type QuestFollowupResponseData = z.infer<typeof questFollowupResponseDataContract>;
