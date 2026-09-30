/**
 * PURPOSE: Defines the structure of parsed Playwright line reporter output for ward fallback reporting
 *
 * USAGE:
 * playwrightLineResultsContract.parse({ passed: ['test title'], failed: [], total: 1 });
 * // Returns: PlaywrightLineResults validated object
 */

import { z } from '#gateway/npm/zod';

export const playwrightLineResultsContract = z
  .object({
    passed: z.array(z.string().min(1).brand<'PlaywrightLineResultsPassed'>()),
    failed: z.array(z.string().min(1).brand<'PlaywrightLineResultsFailed'>()),
    total: z.number().int().min(0).brand<'PlaywrightLineResultsTotal'>(),
  })
  .brand<'PlaywrightLineResults'>();

export type PlaywrightLineResults = z.infer<typeof playwrightLineResultsContract>;
