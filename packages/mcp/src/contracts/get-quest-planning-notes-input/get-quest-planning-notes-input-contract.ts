/**
 * PURPOSE: Validates input for the get-quest-planning-notes MCP tool
 *
 * USAGE:
 * getQuestPlanningNotesInputContract.parse({questId: 'add-auth'});
 * // Returns: GetQuestPlanningNotesInput branded object
 *
 * getQuestPlanningNotesInputContract.parse({questId: 'add-auth', section: 'surface'});
 * // Returns: GetQuestPlanningNotesInput with section filter
 */

import { z } from 'zod';

export const getQuestPlanningNotesInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest to load planning notes for')
      .brand<'QuestId'>(),
    section: z
      .enum(['scope', 'surface', 'synthesis', 'walk', 'review', 'blight'])
      .describe(
        [
          'Optional section filter. Omit to return the full planningNotes object. Section values:',
          '- "scope": planningNotes.scopeClassification',
          '- "surface": planningNotes.surfaceReports (array)',
          '- "synthesis": planningNotes.synthesis',
          '- "walk": planningNotes.walkFindings',
          '- "review": planningNotes.reviewReport',
          '- "blight": planningNotes.blightReports (array)',
        ].join(' '),
      )
      .optional(),
  })
  .strict()
  .brand<'GetQuestPlanningNotesInput'>();

export type GetQuestPlanningNotesInput = z.infer<typeof getQuestPlanningNotesInputContract>;
