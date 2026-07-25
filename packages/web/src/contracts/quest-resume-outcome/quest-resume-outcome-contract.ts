/**
 * PURPOSE: Defines the response shape of POST /api/quests/:questId/resume as the web consumes it —
 * the restored quest status PLUS whether the resume actually started the dispatch queue.
 *
 * USAGE:
 * const outcome = questResumeOutcomeContract.parse(await response.json());
 * // outcome.dispatch.started === false means the quest resumed but nothing is driving the queue
 *
 * `dispatch` exists because resuming a quest and starting the Node dispatcher are two switches for
 * one intent: the endpoint flips both, and reports back when the exclusivity gate kept the second
 * one off (a live `/dumpster-launch` loop already owns the queue). Without it a refused play is
 * indistinguishable from a successful one and the user watches a "resumed" quest do nothing.
 */

import { z } from 'zod';

import { errorMessageContract, questStatusContract } from '@dungeonmaster/shared/contracts';

export const questResumeOutcomeContract = z.object({
  resumed: z.boolean(),
  restoredStatus: questStatusContract,
  dispatch: z.object({
    started: z.boolean(),
    reason: errorMessageContract.optional(),
  }),
});

export type QuestResumeOutcome = z.infer<typeof questResumeOutcomeContract>;
