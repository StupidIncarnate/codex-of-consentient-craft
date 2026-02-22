/**
 * PURPOSE: Defines the input schema for the MCP list-quests tool
 *
 * USAGE:
 * const input: ListQuestsInput = listQuestsInputContract.parse({ guildId: 'f47ac10b-...' });
 * // Returns validated ListQuestsInput with guildId
 */
import { z } from 'zod';

export const listQuestsInputContract = z
  .object({
    guildId: z.string().uuid().describe('The guild ID to list quests for').brand<'GuildId'>(),
  })
  .brand<'ListQuestsInput'>();

export type ListQuestsInput = z.infer<typeof listQuestsInputContract>;
