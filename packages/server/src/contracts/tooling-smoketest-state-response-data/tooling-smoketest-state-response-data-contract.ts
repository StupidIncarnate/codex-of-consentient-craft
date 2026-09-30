/**
 * PURPOSE: Defines the `data` ToolingSmoketestStateResponder returns — the active smoketest run (or
 * null) and the buffered progress events. The orchestrator types each event `unknown`, so no
 * narrower element schema exists to describe it.
 *
 * USAGE:
 * const data = toolingSmoketestStateResponseDataContract.parse(value);
 * // Returns validated ToolingSmoketestStateResponseData
 */

import { z } from '#gateway/npm/zod';
import { smoketestSuiteContract } from '@dungeonmaster/shared/contracts';

export const toolingSmoketestStateResponseDataContract = z
  .strictObject({
    active: z
      .strictObject({
        runId: z.uuid().brand<'ToolingSmoketestStateResponseDataActiveRunId'>(),
        suite: smoketestSuiteContract,
        startedAt: z.iso.datetime().brand<'ToolingSmoketestStateResponseDataActiveStartedAt'>(),
      })
      .brand<'ToolingSmoketestStateResponseDataActive'>()
      .nullable(),
    events: z.array(z.unknown()),
  })
  .brand<'ToolingSmoketestStateResponseData'>();

export type ToolingSmoketestStateResponseData = z.infer<
  typeof toolingSmoketestStateResponseDataContract
>;
