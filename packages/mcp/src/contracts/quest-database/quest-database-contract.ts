/**
 * PURPOSE: Defines the structure of the quest database stored in LowDB
 *
 * USAGE:
 * questDatabaseContract.parse({ quests: [] });
 * // Returns: QuestDatabase object with quests array
 */
import { z } from 'zod';

import { questContract } from '@dungeonmaster/shared/contracts';

export const questDatabaseContract = z.object({
  quests: z.array(questContract),
});

export type QuestDatabase = z.infer<typeof questDatabaseContract>;
