/**
 * PURPOSE: Defines the shape of the currently-active smoketest run tracked in state
 *
 * USAGE:
 * activeSmoketestRunContract.parse({ runId, suite, startedAt });
 * // Returns: ActiveSmoketestRun
 */

import { z } from '#gateway/npm/zod';

import { smoketestSuiteContract } from '@dungeonmaster/shared/contracts';


export const activeSmoketestRunContract = z.object({
  runId: z.uuid().brand<'ActiveSmoketestRunRunId'>(),
  suite: smoketestSuiteContract,
  startedAt: z.iso.datetime().brand<'ActiveSmoketestRunStartedAt'>(),
});

export type ActiveSmoketestRun = z.infer<typeof activeSmoketestRunContract>;
