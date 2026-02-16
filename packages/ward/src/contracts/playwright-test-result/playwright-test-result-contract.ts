/**
 * PURPOSE: Defines the structure of a single Playwright test result entry
 *
 * USAGE:
 * playwrightTestResultContract.parse({ status: 'failed', error: { message: 'Timeout' } });
 * // Returns validated PlaywrightTestResult
 */

import { z } from 'zod';

export const playwrightTestResultContract = z.object({
  status: z.string().brand<'PlaywrightResultStatus'>(),
  error: z
    .object({
      message: z.string().brand<'PlaywrightErrorMessage'>(),
      stack: z.string().brand<'PlaywrightErrorStack'>().optional(),
    })
    .optional(),
});

export type PlaywrightTestResult = z.infer<typeof playwrightTestResultContract>;
