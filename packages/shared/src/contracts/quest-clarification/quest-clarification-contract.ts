/**
 * PURPOSE: Defines the shape of a quest clarification entry containing questions, user answer, and timestamp
 *
 * USAGE:
 * questClarificationContract.parse({id: 'f47ac10b-...', questions: [{question: 'Pick one', header: 'Choice', options: [{label: 'A', description: 'Option A'}], multiSelect: false}], answer: 'Option A', timestamp: '2024-01-15T10:00:00.000Z'});
 * // Returns validated QuestClarification object
 */

import { z } from 'zod';

const questClarificationOptionContract = z.object({
  label: z.string().min(1).brand<'ClarificationOptionLabel'>(),
  description: z.string().brand<'ClarificationOptionDescription'>(),
});

const questClarificationQuestionContract = z.object({
  question: z.string().min(1).brand<'ClarificationQuestionText'>(),
  header: z.string().brand<'ClarificationQuestionHeader'>(),
  options: z.array(questClarificationOptionContract),
  multiSelect: z.boolean(),
});

export const questClarificationContract = z.object({
  id: z.string().uuid().brand<'QuestClarificationId'>(),
  questions: z.array(questClarificationQuestionContract).min(1),
  answer: z.string().brand<'ClarificationAnswer'>(),
  timestamp: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type QuestClarification = z.infer<typeof questClarificationContract>;
