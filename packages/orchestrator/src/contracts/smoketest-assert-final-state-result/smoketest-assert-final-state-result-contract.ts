/**
 * PURPOSE: Defines the data `smoketestAssertFinalStateBroker` returns
 *
 * USAGE:
 * smoketestAssertFinalStateResultContract.parse(value);
 * // Returns validated SmoketestAssertFinalStateResult
 */
import { z } from '#gateway/npm/zod';
import { smoketestAssertionContract } from '../smoketest-assertion/smoketest-assertion-contract';

export const smoketestAssertFinalStateResultContract = z
  .object({ passed: z.boolean(), failures: z.array(smoketestAssertionContract).readonly() })
  .brand<'SmoketestAssertFinalStateResult'>();

export type SmoketestAssertFinalStateResult = z.infer<
  typeof smoketestAssertFinalStateResultContract
>;
