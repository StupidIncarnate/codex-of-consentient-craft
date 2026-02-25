/**
 * PURPOSE: Defines the shape of a clarification question item extracted from ask-user-question tool calls
 *
 * USAGE:
 * clarificationQuestionContract.parse({question: 'Pick one', header: 'Choice', options: [{label: 'A', description: 'Option A'}], multiSelect: false});
 * // Returns validated ClarificationQuestion object
 */

import { z } from 'zod';

const clarificationQuestionOptionContract = z.object({
  label: z.string().min(1).brand<'ClarificationOptionLabel'>(),
  description: z.string().brand<'ClarificationOptionDescription'>(),
});

export type ClarificationQuestionOption = z.infer<typeof clarificationQuestionOptionContract>;

export const clarificationQuestionContract = z.object({
  question: z.string().min(1).brand<'ClarificationQuestionText'>(),
  header: z.string().brand<'ClarificationQuestionHeader'>(),
  options: z.array(clarificationQuestionOptionContract),
  multiSelect: z.boolean(),
});

export type ClarificationQuestion = z.infer<typeof clarificationQuestionContract>;
