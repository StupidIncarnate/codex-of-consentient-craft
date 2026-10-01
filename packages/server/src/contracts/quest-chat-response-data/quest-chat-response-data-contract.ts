/**
 * PURPOSE: Defines the `data` QuestChatResponder returns on success
 *
 * USAGE:
 * const data = questChatResponseDataContract.parse(value);
 * // Returns validated QuestChatResponseData
 */

import { z } from '#gateway/npm/zod';
import { orchestrationProcessContract } from '@dungeonmaster/orchestrator/contracts';

export const questChatResponseDataContract = z
  .strictObject({ chatProcessId: orchestrationProcessContract.shape.processId })
  .brand<'QuestChatResponseData'>();

export type QuestChatResponseData = z.infer<typeof questChatResponseDataContract>;
