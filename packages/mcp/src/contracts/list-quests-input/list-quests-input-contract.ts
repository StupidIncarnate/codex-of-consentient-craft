/**
 * PURPOSE: Defines the input schema for the MCP list-quests tool
 *
 * USAGE:
 * const input: ListQuestsInput = listQuestsInputContract.parse({ guildId: 'f47ac10b-...' });
 * // Returns validated ListQuestsInput with guildId
 */
import { z } from '#gateway/npm/zod';
import { guildContract } from '@dungeonmaster/shared/contracts';

export const listQuestsInputContract = z
  .object({
    guildId: guildContract.shape.id,
  })
  .strict()
  .brand<'ListQuestsInput'>();

export type ListQuestsInput = z.infer<typeof listQuestsInputContract>;
