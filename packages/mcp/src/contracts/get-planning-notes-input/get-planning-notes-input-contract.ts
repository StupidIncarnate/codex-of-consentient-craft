/**
 * PURPOSE: Validates input for the get-planning-notes MCP tool
 *
 * USAGE:
 * getPlanningNotesInputContract.parse({questId: 'add-auth'});
 * // Returns: GetPlanningNotesInput branded object
 *
 * getPlanningNotesInputContract.parse({questId: 'add-auth', section: 'surface'});
 * // Returns: GetPlanningNotesInput with section filter
 */

import { z } from 'zod';

export const getPlanningNotesInputContract = z
  .object({
    questId: z
      .string()
      .min(1)
      .describe('The ID of the quest to load planning notes for')
      .brand<'QuestId'>(),
    section: z
      .enum(['scope', 'surface', 'synthesis', 'walk', 'review'])
      .describe(
        [
          'Optional section filter. Omit to return the full planningNotes object. Section values:',
          '- "scope": planningNotes.scopeClassification',
          '- "surface": planningNotes.surfaceReports (array)',
          '- "synthesis": planningNotes.synthesis',
          '- "walk": planningNotes.walkFindings',
          '- "review": planningNotes.reviewReport',
        ].join(' '),
      )
      .optional(),
  })
  .strict()
  .brand<'GetPlanningNotesInput'>();

export type GetPlanningNotesInput = z.infer<typeof getPlanningNotesInputContract>;
