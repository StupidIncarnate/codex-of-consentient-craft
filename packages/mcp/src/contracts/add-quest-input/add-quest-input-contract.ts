/**
 * PURPOSE: Defines the input schema for the MCP add-quest tool that creates quest JSON files
 *
 * USAGE:
 * const input: AddQuestInput = addQuestInputContract.parse({ title: 'Add Auth', userRequest: 'User wants...', guildId: 'f47ac10b-...' });
 * // Returns validated AddQuestInput with title, userRequest, and guildId
 */
import { z } from 'zod';

export const addQuestInputContract = z
  .object({
    title: z.string().min(1).describe('The title of the quest').brand<'QuestTitle'>(),
    userRequest: z
      .string()
      .min(1)
      .describe('The original user request that initiated this quest')
      .brand<'UserRequest'>(),
    guildId: z.string().uuid().describe('The guild ID to create the quest in').brand<'GuildId'>(),
  })
  .brand<'AddQuestInput'>();

export type AddQuestInput = z.infer<typeof addQuestInputContract>;
