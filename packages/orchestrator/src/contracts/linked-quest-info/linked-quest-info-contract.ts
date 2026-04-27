/**
 * PURPOSE: Describes the quest a chat session is linked to (questId, plus optional workItemId + role) so chat-replay emits can be stamped with quest routing keys.
 *
 * USAGE:
 * linkedQuestInfoContract.parse({ questId, workItemId, role });
 * // Returns: LinkedQuestInfo
 */
import { z } from 'zod';

import {
  questIdContract,
  questWorkItemIdContract,
  workItemRoleContract,
} from '@dungeonmaster/shared/contracts';

export const linkedQuestInfoContract = z.object({
  questId: questIdContract,
  workItemId: questWorkItemIdContract.optional(),
  role: workItemRoleContract.optional(),
});

export type LinkedQuestInfo = z.infer<typeof linkedQuestInfoContract>;
