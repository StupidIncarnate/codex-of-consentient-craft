/**
 * PURPOSE: The outcome of releasing stale boot and registry locks during cleanup — whether stale
 * locks were unlinked ('released'), no stale locks were present ('none-held'), or unlinking a stale
 * lock failed ('failed'). Three states so an operator or automated agent reading JSON can
 * distinguish a healthy run where no locks were stuck from a run where a stuck lock could not be
 * released.
 *
 * USAGE:
 * lockReleaseOutcomeContract.parse('released');
 * // Returns: 'released' as LockReleaseOutcome
 */

import { z } from '#gateway/npm/zod';

export const lockReleaseOutcomeContract = z.enum(['released', 'none-held', 'failed']);

export type LockReleaseOutcome = z.infer<typeof lockReleaseOutcomeContract>;
