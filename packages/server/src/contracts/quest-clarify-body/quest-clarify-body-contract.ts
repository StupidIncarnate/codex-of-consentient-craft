/**
 * PURPOSE: Defines the validated body shape for the quest-clarify responder
 *
 * USAGE:
 * const { answers, questions } = questClarifyBodyContract.parse(body);
 * // Returns: { answers: ClarificationAnswer[], questions: ClarificationQuestion[] }
 */

import {
  clarificationAnswerContract,
  clarificationQuestionContract,
} from '@dungeonmaster/orchestrator';

import { z } from '#gateway/npm/zod';

export const questClarifyBodyContract = z
  .object({
    answers: z.array(clarificationAnswerContract).min(1),
    questions: z.array(clarificationQuestionContract),
  })
  .brand<'QuestClarifyBody'>();

export type QuestClarifyBody = z.infer<typeof questClarifyBodyContract>;
