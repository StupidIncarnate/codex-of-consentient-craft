/**
 * PURPOSE: Defines the input schema for the MCP start-quest tool that starts quest orchestration
 *
 * USAGE:
 * const input: StartQuestInput = startQuestInputContract.parse({ questId: 'add-auth' });
 * // Returns validated StartQuestInput with questId
 */
import { z } from 'zod';

export const startQuestInputContract = z
  .object({
    questId: z.string().min(1).describe('The ID of the quest to start').brand<'QuestId'>(),
  })
  .brand<'StartQuestInput'>();

export type StartQuestInput = z.infer<typeof startQuestInputContract>;
