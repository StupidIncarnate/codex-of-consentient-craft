/**
 * PURPOSE: Runtime entry stored in smoketestListenerState per active smoketest quest — assertions + teardown + scenario-driver stop handle + suite-kind marker used by the post-terminal listener
 *
 * USAGE:
 * const entry: SmoketestListenerEntry = smoketestListenerEntryContract.parse({ assertions, postTeardownChecks, stopDriver, isOrchestration });
 */

import { z } from 'zod';

import { smoketestAssertionContract } from '../smoketest-assertion/smoketest-assertion-contract';
import { smoketestTeardownCheckContract } from '../smoketest-teardown-check/smoketest-teardown-check-contract';

// Functions cannot be fully Zod-validated — assertion/teardown arrays validate fully;
// stopDriver accepts any callable (or undefined) as an internal runtime handle.
export const smoketestListenerEntryContract = z.object({
  assertions: z.array(smoketestAssertionContract).readonly(),
  postTeardownChecks: z.array(smoketestTeardownCheckContract).readonly().optional(),
  stopDriver: z.function().optional(),
  isOrchestration: z.boolean(),
});

export type SmoketestListenerEntry = z.infer<typeof smoketestListenerEntryContract>;
