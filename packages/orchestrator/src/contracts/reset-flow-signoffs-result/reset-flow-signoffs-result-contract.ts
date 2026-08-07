/**
 * PURPOSE: What a Siegemaster walk reset hands back — how many sign-offs it cleared off the flow,
 * and the id of the `walk-reset` note it appended
 *
 * USAGE:
 * resetFlowSignoffsResultContract.parse({ clearedCount: 12, noteId: 'walk-reset-login-flow-1' });
 * // Returns: ResetFlowSignoffsResult
 *
 * `clearedCount` is reported rather than inferred because a reset over a flow whose units were
 * never signed is a legitimate no-op: 0 is the honest answer, not a failure, and the caller needs to
 * be able to tell "nothing was signed" apart from "nothing was found".
 */

import { z } from 'zod';

import { questNoteIdContract } from '@dungeonmaster/shared/contracts';

export const resetFlowSignoffsResultContract = z.object({
  clearedCount: z
    .number()
    .int()
    .nonnegative()
    .brand<'ClearedSignoffCount'>()
    .describe('How many units on the flow carried a siegemasterSignoff that this reset removed'),
  noteId: questNoteIdContract.describe(
    'The id of the walk-reset note appended to quest.planningNotes.questNotes',
  ),
});

export type ResetFlowSignoffsResult = z.infer<typeof resetFlowSignoffsResultContract>;
