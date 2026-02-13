/**
 * PURPOSE: Defines the input schema for the MCP add-quest tool that creates quest JSON files
 *
 * USAGE:
 * const input: AddQuestInput = addQuestInputContract.parse({ title: 'Add Auth', userRequest: 'User wants...', projectId: 'f47ac10b-...' });
 * // Returns validated AddQuestInput with title, userRequest, and projectId
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
    projectId: z
      .string()
      .uuid()
      .describe('The project ID to create the quest in')
      .brand<'ProjectId'>(),
  })
  .brand<'AddQuestInput'>();

export type AddQuestInput = z.infer<typeof addQuestInputContract>;
