/**
 * PURPOSE: Defines one answered clarification: the question's header, every option label the user picked
 * and the composer text typed with them. Reach for this over clarificationQuestionContract when the value
 * is what the user sent back rather than what the agent asked.
 *
 * USAGE:
 * clarificationAnswerContract.parse({ header: 'Letters', labels: ['Alpha', 'Gamma'], text: 'prefer Gamma' });
 * // Returns a validated ClarificationAnswer
 *
 * An answer with no labels and no text has nothing to send and is refused.
 */

import { z } from '#gateway/npm/zod';

export const clarificationAnswerContract = z
  .object({
    header: z.string().brand<'ClarificationAnswerHeader'>(),
    labels: z.array(z.string().min(1).brand<'ClarificationAnswerLabels'>()),
    text: z.string().trim().min(1).brand<'ClarificationAnswerText'>().optional(),
  })
  .refine((answer) => answer.labels.length > 0 || answer.text !== undefined, {
    message: 'A clarification answer needs at least one label or non-blank text',
  })
  .brand<'ClarificationAnswer'>();

export type ClarificationAnswer = z.infer<typeof clarificationAnswerContract>;
