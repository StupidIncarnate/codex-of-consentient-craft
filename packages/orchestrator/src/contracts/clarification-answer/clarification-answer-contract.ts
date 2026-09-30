/**
 * PURPOSE: Defines one answered clarification: the question's header and the label of the option the user picked.
 * Reach for this over clarificationQuestionContract when the value is what the user sent back rather than
 * what the agent asked.
 *
 * USAGE:
 * clarificationAnswerContract.parse({ header: 'Database', label: 'PostgreSQL' });
 * // Returns a validated ClarificationAnswer
 */

import { z } from '#gateway/npm/zod';

export const clarificationAnswerContract = z
  .object({
    header: z.string().brand<'ClarificationAnswerHeader'>(),
    label: z.string().min(1).brand<'ClarificationAnswerLabel'>(),
  })
  .brand<'ClarificationAnswer'>();

export type ClarificationAnswer = z.infer<typeof clarificationAnswerContract>;
