/**
 * PURPOSE: Defines the `data` QuestClarifyResponder returns on success
 *
 * USAGE:
 * const data = questClarifyResponseDataContract.parse(value);
 * // Returns validated QuestClarifyResponseData
 */

import { z } from '#gateway/npm/zod';
import { orchestrationProcessContract } from '@dungeonmaster/orchestrator/contracts';

export const questClarifyResponseDataContract = z
  .strictObject({ chatProcessId: orchestrationProcessContract.shape.processId })
  .brand<'QuestClarifyResponseData'>();

export type QuestClarifyResponseData = z.infer<typeof questClarifyResponseDataContract>;
