/**
 * PURPOSE: Reports the outcome of a reset step — what was restored, the diff undid, and what was NOT cleared.
 *
 * `reseeded` and `bindings` appear only when the step reseeded: the recipe's name, and the records it
 * produced — the same shape a `seed` step returns, so a later step can refer to them.
 *
 * USAGE:
 * resetReadingContract.parse({ restored: 'clean', undid, NOT_cleared: ['server memory'] });
 * // Returns a validated ResetReading
 */

import { z } from '#gateway/npm/zod';

import { seedResultContract } from '../seed-result/seed-result-contract';
import { resetUndidContract } from '../reset-undid/reset-undid-contract';

export const resetReadingContract = z
  .object({
    restored: z.string().brand<'ResetReadingRestored'>(),
    undid: resetUndidContract,
    NOT_cleared: z.array(z.string().brand<'ResetReadingNOTCleared'>()),
    reseeded: z.string().brand<'ResetReadingReseeded'>().optional(),
    bindings: seedResultContract.optional(),
  })
  .brand<'ResetReading'>();

export type ResetReading = z.infer<typeof resetReadingContract>;
