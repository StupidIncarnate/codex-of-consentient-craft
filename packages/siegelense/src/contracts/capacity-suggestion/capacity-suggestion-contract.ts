/**
 * PURPOSE: What `capacitySuggestTransformer` works out — the answer's two headline numbers plus the
 * three intermediates the sentence beside them has to name. Reach for this over `CapacityAnswer`:
 * that is the whole call's return, carrying the host reading and the profile group; this is only
 * the arithmetic, so the division can be graded on its own with no filesystem in the way.
 *
 * `memoryAllows` and `ceilingLeft` are both kept because `suggested` is the MINIMUM of the two and
 * the two mean different things: a `suggested: 0` from `memoryAllows` is the machine plainly not
 * holding another instance, which is `start`'s one hard refusal (line 1588-1590); a `suggested: 0`
 * from `ceilingLeft` is the policy pool being full, which is the refusal at line 1540. Collapsing
 * them would leave the refusal unable to say which it was.
 *
 * USAGE:
 * capacitySuggestionContract.parse({
 *   suggested: 2, ceiling: 3, memoryAllows: 2, ceilingLeft: 2, availableMB: 4808,
 * });
 * // Returns a validated CapacitySuggestion
 */

import { z } from 'zod';

import { megabytesContract } from '../megabytes/megabytes-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';

export const capacitySuggestionContract = z
  .object({
    suggested: readingCountContract,
    ceiling: readingCountContract,
    memoryAllows: readingCountContract,
    ceilingLeft: readingCountContract,
    availableMB: megabytesContract,
  })
  .strict();

export type CapacitySuggestion = z.infer<typeof capacitySuggestionContract>;
