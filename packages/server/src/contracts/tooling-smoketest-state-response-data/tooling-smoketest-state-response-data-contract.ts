/**
 * PURPOSE: Defines the `data` ToolingSmoketestStateResponder returns — the active smoketest run (or
 * null) and the buffered progress events. Each event is arbitrary JSON, so `z.json()` describes it.
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
    events: z.array(z.json()),
  })
  .brand<'ToolingSmoketestStateResponseData'>();

export type ToolingSmoketestStateResponseData = z.infer<
  typeof toolingSmoketestStateResponseDataContract
>;
