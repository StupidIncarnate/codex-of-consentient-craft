/**
 * PURPOSE: Defines the structure of a passing test entry captured from jest/playwright JSON output
 *
 * USAGE:
 * passingTestContract.parse({suitePath: 'src/index.test.ts', testName: 'should work', durationMs: 42});
 * // Returns: PassingTest validated object
 */

import { z } from 'zod';
import { durationMsContract } from '../duration-ms/duration-ms-contract';

export const passingTestContract = z.object({
  suitePath: z.string().brand<'SuitePath'>(),
  testName: z.string().brand<'TestName'>(),
  durationMs: durationMsContract.default(0),
});

export type PassingTest = z.infer<typeof passingTestContract>;
