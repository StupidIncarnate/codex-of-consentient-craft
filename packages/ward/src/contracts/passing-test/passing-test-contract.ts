/**
 * PURPOSE: Defines the structure of a passing test entry captured from jest/playwright JSON output
 *
 * USAGE:
 * passingTestContract.parse({suitePath: 'src/index.test.ts', testName: 'should work', durationMs: 42});
 * // Returns: PassingTest validated object
 */

import { z } from '#gateway/npm/zod';
import { passingTestContract } from './passing-test-contract';

export const passingTestContract = z.object({
  suitePath: z.string().brand<'PassingTestSuitePath'>(),
  testName: z.string().brand<'PassingTestTestName'>(),
  durationMs: z.number().nonnegative().brand<'PassingTestDurationMs'>().default(0),
}).brand<'PassingTest'>();

export type PassingTest = z.infer<typeof passingTestContract>;
