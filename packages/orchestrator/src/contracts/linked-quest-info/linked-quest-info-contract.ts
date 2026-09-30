/**
 * PURPOSE: Describes the quest a chat session is linked to (questId, plus optional workItemId + role) so chat-replay emits can be stamped with quest routing keys.
 *
 * USAGE:
 * linkedQuestInfoContract.parse({ questId, workItemId, role });
 * // Returns: LinkedQuestInfo
 */
import { z } from '#gateway/npm/zod';

import { workItemRoleContract, questContract, workItemContract } from '@dungeonmaster/shared/contracts';

export const linkedQuestInfoContract = z.object({
  questId: questContract.shape.id,
  workItemId: workItemContract.shape.id.optional(),
  role: workItemRoleContract.optional(),
});

export type LinkedQuestInfo = z.infer<typeof linkedQuestInfoContract>;
