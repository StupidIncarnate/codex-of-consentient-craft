/**
 * PURPOSE: Defines the structure of a Playwright spec entry containing tests and results
 *
 * USAGE:
 * playwrightSpecContract.parse({ title: 'should login', tests: [{ results: [{ status: 'failed' }] }] });
 * // Returns validated PlaywrightSpec
 */

import { z } from 'zod';
import { playwrightTestResultContract } from '../playwright-test-result/playwright-test-result-contract';

export const playwrightSpecContract = z.object({
  title: z.string().brand<'PlaywrightSpecTitle'>(),
  tests: z.array(
    z.object({
      results: z.array(playwrightTestResultContract),
    }),
  ),
});

export type PlaywrightSpec = z.infer<typeof playwrightSpecContract>;
