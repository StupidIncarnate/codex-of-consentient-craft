/**
 * PURPOSE: Runtime entry stored in smoketestListenerState per active smoketest quest — assertions + teardown + scenario-driver stop handle + suite-kind marker used by the post-terminal listener
 *
 * USAGE:
 * const entry: SmoketestListenerEntry = smoketestListenerEntryContract.parse({ assertions, postTeardownChecks, stopDriver, isOrchestration });
 */

import { z } from '#gateway/npm/zod';

import { smoketestAssertionContract } from '../smoketest-assertion/smoketest-assertion-contract';
import { smoketestTeardownCheckContract } from '../smoketest-teardown-check/smoketest-teardown-check-contract';

// `stopDriver` is a function — a Zod object schema cannot check callability, so it stays out of
// the parse and is attached only through the type intersection below. `.loose()` carries it
// through `.parse()` unvalidated when a real caller supplies one; assertion/teardown arrays and
// `isOrchestration` still validate fully.
export const smoketestListenerEntryContract = z
  .object({
    assertions: z.array(smoketestAssertionContract).readonly(),
    postTeardownChecks: z.array(smoketestTeardownCheckContract).readonly().optional(),
    isOrchestration: z.boolean(),
  })
  .loose();

export type SmoketestListenerEntry = z.infer<typeof smoketestListenerEntryContract> & {
  stopDriver?: () => void;
};
