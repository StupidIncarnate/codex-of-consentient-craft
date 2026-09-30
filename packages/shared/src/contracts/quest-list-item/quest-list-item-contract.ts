/**
 * PURPOSE: Defines a simplified quest structure for display in list views
 *
 * USAGE:
 * questListItemContract.parse({id: 'add-auth', title: 'Add Auth', status: 'in_progress', ...});
 * // Returns: QuestListItem object
 */

import { z } from '#gateway/npm/zod';

import { questStatusContract } from '../quest-status/quest-status-contract';
import { questContract } from '../quest/quest-contract';
import { sessionContract } from '../session/session-contract';

export const questListItemContract = z.object({
  id: questContract.shape.id,
  folder: z.string().min(1).brand<'QuestFolder'>(),
  title: z.string().min(1).brand<'QuestTitle'>(),
  status: questStatusContract,
  createdAt: z.iso.datetime().brand<'QuestListItemCreatedAt'>(),
  stepProgress: z.string().brand<'StepProgress'>().optional(),
  activeSessionId: sessionContract.shape.id.optional(),
  userRequest: z.string().brand<'UserRequest'>().optional(),
});

export type QuestListItem = z.infer<typeof questListItemContract>;
