/**
 * PURPOSE: Reports the outcome of a reset step — what was restored, the diff undid, and what was NOT cleared.
 *
 * USAGE:
 * resetReadingContract.parse({ restored: 'clean', undid, NOT_cleared: ['server memory'] });
 * // Returns a validated ResetReading
 */

import { z } from '#gateway/npm/zod';

import { resetUndidContract } from '../reset-undid/reset-undid-contract';

export const resetReadingContract = z.object({
  restored: z.string().brand<'ResetReadingRestored'>(),
  undid: resetUndidContract,
  NOT_cleared: z.array(z.string().brand<'ResetReadingNOTCleared'>()),
}).brand<'ResetReading'>();

export type ResetReading = z.infer<typeof resetReadingContract>;
