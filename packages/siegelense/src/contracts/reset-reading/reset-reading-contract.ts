/**
 * PURPOSE: Reports the outcome of a reset step — what was restored, the diff undid, and what was NOT cleared.
 *
 * USAGE:
 * resetReadingContract.parse({ restored: 'clean', undid, NOT_cleared: ['server memory'] });
 * // Returns a validated ResetReading
 */

import { z } from 'zod';
import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { resetUndidContract } from '../reset-undid/reset-undid-contract';

export const resetReadingContract = z.object({
  restored: contentTextContract,
  undid: resetUndidContract,
  NOT_cleared: z.array(contentTextContract),
});

export type ResetReading = z.infer<typeof resetReadingContract>;
