/**
 * PURPOSE: Defines the structure of a test failure entry
 *
 * USAGE:
 * testFailureContract.parse({suitePath: 'src/index.test.ts', testName: 'should work', message: 'Expected true'});
 * // Returns: TestFailure validated object
 */

import { z } from 'zod';

export const testFailureContract = z.object({
  suitePath: z.string().brand<'SuitePath'>(),
  testName: z.string().brand<'TestName'>(),
  message: z.string().brand<'FailureMessage'>(),
  stackTrace: z.string().brand<'StackTrace'>().optional(),
});

export type TestFailure = z.infer<typeof testFailureContract>;
