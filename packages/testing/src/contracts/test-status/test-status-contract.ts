/**
 * PURPOSE: Defines the possible test result status values from Playwright TestInfo
 *
 * USAGE:
 * const status = testStatusContract.parse('failed');
 * // Returns validated TestStatus branded type
 */

import { z } from 'zod';

export const testStatusContract = z.enum([
  'passed',
  'failed',
  'timedOut',
  'skipped',
  'interrupted',
]);

export type TestStatus = z.infer<typeof testStatusContract>;
