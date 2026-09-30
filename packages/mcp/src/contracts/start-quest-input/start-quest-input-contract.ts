/**
 * PURPOSE: Defines the input schema for the MCP start-quest tool that starts quest orchestration
 *
 * USAGE:
 * const input: StartQuestInput = startQuestInputContract.parse({ questId: 'add-auth' });
 * // Returns validated StartQuestInput with questId
 */
import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const startQuestInputContract = z
  .object({
    questId: questContract.shape.id,
  })
  .strict()
  .brand<'StartQuestInput'>();

export type StartQuestInput = z.infer<typeof startQuestInputContract>;
