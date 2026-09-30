/**
 * PURPOSE: Defines the response shape of POST /api/quests/:questId/resume as the web consumes it —
 * the restored quest status PLUS whether the resume actually started the dispatch queue.
 *
 * USAGE:
 * const outcome = questResumeOutcomeContract.parse(await response.json());
 * // outcome.dispatch.started === false means the quest resumed but nothing is driving the queue
 *
 * `dispatch` exists because resuming a quest and starting the Node dispatcher are two switches for
 * one intent: the endpoint flips both, and reports back when the play call threw or the quest had
 * no dispatchable work. Without it a failed play is indistinguishable from a successful one and
 * the user watches a "resumed" quest do nothing.
 */

import { z } from '#gateway/npm/zod';

import { questStatusContract } from '@dungeonmaster/shared/contracts';

export const questResumeOutcomeContract = z
  .object({
    resumed: z.boolean(),
    restoredStatus: questStatusContract,
    dispatch: z
      .object({
        started: z.boolean(),
        reason: z.string().brand<'QuestResumeOutcomeDispatchReason'>().optional(),
      })
      .brand<'QuestResumeOutcomeDispatch'>(),
  })
  .brand<'QuestResumeOutcome'>();

export type QuestResumeOutcome = z.infer<typeof questResumeOutcomeContract>;
