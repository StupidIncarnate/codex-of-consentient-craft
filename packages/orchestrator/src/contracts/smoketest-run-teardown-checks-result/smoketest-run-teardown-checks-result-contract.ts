/**
 * PURPOSE: Defines the data `smoketestRunTeardownChecksBroker` returns
 *
 * USAGE:
 * smoketestRunTeardownChecksResultContract.parse(value);
 * // Returns validated SmoketestRunTeardownChecksResult
 */
import { z } from '#gateway/npm/zod';
import { smoketestTeardownCheckContract } from '../smoketest-teardown-check/smoketest-teardown-check-contract';

export const smoketestRunTeardownChecksResultContract = z
  .object({ passed: z.boolean(), failures: z.array(smoketestTeardownCheckContract).readonly() })
  .brand<'SmoketestRunTeardownChecksResult'>();

export type SmoketestRunTeardownChecksResult = z.infer<
  typeof smoketestRunTeardownChecksResultContract
>;
