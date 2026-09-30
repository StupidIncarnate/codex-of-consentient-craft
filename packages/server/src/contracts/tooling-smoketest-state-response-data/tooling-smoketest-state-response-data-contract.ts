/**
 * PURPOSE: Defines the `data` ToolingSmoketestStateResponder returns — the active smoketest run (or
 * null) and the buffered progress events. Each event is arbitrary JSON, so `z.json()` describes it.
 *
 * USAGE:
 * const data = toolingSmoketestStateResponseDataContract.parse(value);
 * // Returns validated ToolingSmoketestStateResponseData
 */

import { activeSmoketestRunContract } from '@dungeonmaster/orchestrator';

import { z } from '#gateway/npm/zod';

export const toolingSmoketestStateResponseDataContract = z
  .strictObject({
    active: activeSmoketestRunContract.nullable(),
    events: z.array(z.json()),
  })
  .brand<'ToolingSmoketestStateResponseData'>();

export type ToolingSmoketestStateResponseData = z.infer<
  typeof toolingSmoketestStateResponseDataContract
>;
