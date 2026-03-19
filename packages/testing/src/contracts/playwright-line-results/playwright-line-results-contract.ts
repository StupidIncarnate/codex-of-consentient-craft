/**
 * PURPOSE: Defines the structure of parsed Playwright line reporter output for ward fallback reporting
 *
 * USAGE:
 * playwrightLineResultsContract.parse({ passed: ['test title'], failed: [], total: 1 });
 * // Returns: PlaywrightLineResults validated object
 */

import { z } from 'zod';

export const playwrightLineResultsContract = z.object({
  passed: z.array(z.string().min(1).brand<'PlaywrightTestTitle'>()),
  failed: z.array(z.string().min(1).brand<'PlaywrightTestTitle'>()),
  total: z.number().int().min(0).brand<'PlaywrightTestCount'>(),
});

export type PlaywrightLineResults = z.infer<typeof playwrightLineResultsContract>;
