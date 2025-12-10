/**
 * PURPOSE: Defines a simplified quest structure for display in list views
 *
 * USAGE:
 * questListItemContract.parse({id: 'add-auth', title: 'Add Auth', status: 'in_progress', ...});
 * // Returns: QuestListItem object
 */

import { z } from 'zod';

import { phaseTypeContract } from '../phase-type/phase-type-contract';
import { questStatusContract } from '../quest-status/quest-status-contract';

export const questListItemContract = z.object({
  id: z.string().min(1).brand<'QuestId'>(),
  folder: z.string().min(1).brand<'QuestFolder'>(),
  title: z.string().min(1).brand<'QuestTitle'>(),
  status: questStatusContract,
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  currentPhase: phaseTypeContract.optional(),
  taskProgress: z.string().brand<'TaskProgress'>().optional(),
});

export type QuestListItem = z.infer<typeof questListItemContract>;
