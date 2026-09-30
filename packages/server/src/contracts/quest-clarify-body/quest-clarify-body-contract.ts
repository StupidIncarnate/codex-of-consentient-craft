/**
 * PURPOSE: Defines the validated body shape for the quest-clarify responder
 *
 * USAGE:
 * const { answers, questions } = questClarifyBodyContract.parse(body);
 * // Returns: { answers: array, questions: array }
 */

import { z } from '#gateway/npm/zod';

export const questClarifyBodyContract = z
  .object({
    answers: z.array(z.unknown()).min(1),
    questions: z.array(z.unknown()),
  })
  .brand<'QuestClarifyBody'>();

export type QuestClarifyBody = z.infer<typeof questClarifyBodyContract>;
