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

import { z } from 'zod';
import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { seedResultContract } from '../seed-result/seed-result-contract';
import { resetUndidContract } from '../reset-undid/reset-undid-contract';

export const resetReadingContract = z.object({
  restored: contentTextContract,
  undid: resetUndidContract,
  NOT_cleared: z.array(contentTextContract),
  reseeded: contentTextContract.optional(),
  bindings: seedResultContract.optional(),
});

export type ResetReading = z.infer<typeof resetReadingContract>;
