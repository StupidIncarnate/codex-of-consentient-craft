/**
 * PURPOSE: Defines the shape of a pending clarification entry linking a quest to its unanswered questions
 *
 * USAGE:
 * pendingClarificationEntryContract.parse({questId: 'add-auth', questions: [{question: 'Pick one', header: 'Choice', options: [{label: 'A', description: 'Option A'}], multiSelect: false}]});
 * // Returns validated PendingClarificationEntry object
 */

import { z } from '#gateway/npm/zod';

import { questContract } from '@dungeonmaster/shared/contracts';

import { clarificationQuestionContract } from '../clarification-question/clarification-question-contract';

export const pendingClarificationEntryContract = z
  .object({
    questId: questContract.shape.id,
    questions: z.array(clarificationQuestionContract).min(1),
  })
  .brand<'PendingClarificationEntry'>();

export type PendingClarificationEntry = z.infer<typeof pendingClarificationEntryContract>;
