/**
 * PURPOSE: Defines the shape of the currently-active smoketest run tracked in state
 *
 * USAGE:
 * activeSmoketestRunContract.parse({ runId, suite, startedAt });
 * // Returns: ActiveSmoketestRun
 */

import { z } from 'zod';

import { smoketestRunIdContract, smoketestSuiteContract } from '@dungeonmaster/shared/contracts';

import { isoTimestampContract } from '../iso-timestamp/iso-timestamp-contract';

export const activeSmoketestRunContract = z.object({
  runId: smoketestRunIdContract,
  suite: smoketestSuiteContract,
  startedAt: isoTimestampContract,
});

export type ActiveSmoketestRun = z.infer<typeof activeSmoketestRunContract>;
