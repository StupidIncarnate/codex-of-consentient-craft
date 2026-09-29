/**
 * PURPOSE: What `capacitySuggestTransformer` works out — the answer's two headline numbers plus the
 * intermediates the sentence beside them has to name. Reach for this over `CapacityAnswer`:
 * that is the whole call's return, carrying the host reading and the profile group; this is only
 * the arithmetic, so the division can be graded on its own with no filesystem in the way.
 *
 * `memoryAllows`, `cpuAllows` and `ceilingLeft` are all kept separately because `suggested` is the
 * MINIMUM of the three and each means something different: a `suggested: 0` from `memoryAllows` is
 * the machine plainly not holding another instance, which is `start`'s one hard refusal (line
 * 1588-1590); a `suggested: 0` from `ceilingLeft` is the policy pool being full, which is the
 * refusal at line 1540. `cpuAllows` never reaches 0 — a saturated CPU throttles rather than refuses
 * (`capacityStatics.cpu.minAllowed`) — but it can still be the tightest of the three, and collapsing
 * it into `memoryAllows` would leave the `why` unable to say load, not memory, made the number what
 * it is.
 *
 * USAGE:
 * capacitySuggestionContract.parse({
 *   suggested: 2, ceiling: 3, memoryAllows: 2, cpuAllows: 6, ceilingLeft: 2, availableMB: 4808,
 * });
 * // Returns a validated CapacitySuggestion
 */

import { z } from '#gateway/npm/zod';

import { megabytesContract } from '../megabytes/megabytes-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';

export const capacitySuggestionContract = z
  .object({
    suggested: readingCountContract,
    ceiling: readingCountContract,
    memoryAllows: readingCountContract,
    cpuAllows: readingCountContract,
    ceilingLeft: readingCountContract,
    availableMB: megabytesContract,
  })
  .strict();

export type CapacitySuggestion = z.infer<typeof capacitySuggestionContract>;
