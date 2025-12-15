/**
 * PURPOSE: Defines the input schema for the MCP add-quest tool that creates quest JSON files
 *
 * USAGE:
 * const input: AddQuestInput = addQuestInputContract.parse({ title: 'Add Auth', userRequest: 'User wants...', tasks: [...] });
 * // Returns validated AddQuestInput with title, userRequest, and tasks array
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
    tasks: z
      .array(
        z.object({
          id: z.string().uuid().describe('Unique task ID (UUID format)').brand<'TaskId'>(),
          name: z.string().min(1).describe('Human-readable task name').brand<'TaskName'>(),
          type: z
            .enum(['discovery', 'implementation', 'testing', 'review', 'documentation'])
            .describe('Type of task'),
          description: z
            .string()
            .describe('What this task accomplishes')
            .brand<'TaskDescription'>()
            .optional(),
          dependencies: z
            .array(z.string().uuid().describe('Task ID').brand<'TaskId'>())
            .describe('IDs of tasks this depends on')
            .optional(),
          filesToCreate: z
            .array(z.string().describe('File path').brand<'FilePath'>())
            .describe('File paths to create')
            .optional(),
          filesToEdit: z
            .array(z.string().describe('File path').brand<'FilePath'>())
            .describe('Existing file paths to edit')
            .optional(),
        }),
      )
      .describe('Array of tasks to complete the quest'),
  })
  .brand<'AddQuestInput'>();

export type AddQuestInput = z.infer<typeof addQuestInputContract>;
