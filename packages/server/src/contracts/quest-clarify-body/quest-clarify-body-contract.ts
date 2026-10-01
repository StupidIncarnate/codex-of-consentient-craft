/**
 * PURPOSE: Defines the validated body shape for the quest-clarify responder. Each answer is the
 * orchestrator's ClarificationAnswer plus the images pasted into that answer's composer, which the
 * responder persists and strips before the orchestrator sees the answer.
 *
 * USAGE:
 * const { answers, questions } = questClarifyBodyContract.parse(body);
 * // Returns: { answers: Array<ClarificationAnswer & { images?: PastedImageUploadList }>, questions: ClarificationQuestion[] }
 */

import {
  clarificationAnswerContract,
  clarificationQuestionContract,
} from '@dungeonmaster/orchestrator';

import { z } from '#gateway/npm/zod';

import { pastedImageUploadListContract } from '../pasted-image-upload-list/pasted-image-upload-list-contract';

// An intersection, not `.extend`: clarificationAnswerContract is refined and branded, so it has no
// object shape to extend. Each side strips the keys it does not own and the results merge.
const answerImagesContract = z
  .object({ images: pastedImageUploadListContract.optional() })
  .brand<'AnswerImages'>();

export const questClarifyBodyContract = z
  .object({
    answers: z.array(clarificationAnswerContract.and(answerImagesContract)).min(1),
    questions: z.array(clarificationQuestionContract),
  })
  .brand<'QuestClarifyBody'>();

export type QuestClarifyBody = z.infer<typeof questClarifyBodyContract>;
