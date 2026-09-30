/**
 * PURPOSE: Defines the data `streamJsonToClarificationTransformer` returns
 *
 * USAGE:
 * streamJsonToClarificationContract.parse(value);
 * // Returns validated StreamJsonToClarification
 */
import { z } from '#gateway/npm/zod';
import { clarificationQuestionContract } from '../clarification-question/clarification-question-contract';

export const streamJsonToClarificationContract = z
  .object({ questions: z.array(clarificationQuestionContract) })
  .brand<'StreamJsonToClarification'>();

export type StreamJsonToClarification = z.infer<typeof streamJsonToClarificationContract>;
