/**
 * PURPOSE: Defines the complete result of a ward run across all check types
 *
 * USAGE:
 * wardResultContract.parse({runId: '1739625600000-a3f1', timestamp: 1739625600000, filters: {}, checks: []});
 * // Returns: WardResult validated object
 */

import { z } from '#gateway/npm/zod';
import { runFiltersContract } from '../run-filters/run-filters-contract';
import { checkResultContract } from '../check-result/check-result-contract';

export const wardResultContract = z
  .object({
    runId: z
      .string()
      .regex(/^\d+-[a-f0-9]+$/u, 'Invalid RunId format: expected timestamp-hex pattern')
      .brand<'WardResultRunId'>(),
    timestamp: z.number().brand<'WardResultTimestamp'>(),
    filters: runFiltersContract,
    checks: z.array(checkResultContract),
    durationMs: z.number().nonnegative().default(0).brand<'WardResultDurationMs'>(),
  })
  .brand<'WardResult'>();

export type WardResult = z.infer<typeof wardResultContract>;
