/**
 * PURPOSE: Defines the structure of a test failure entry
 *
 * USAGE:
 * testFailureContract.parse({suitePath: 'src/index.test.ts', testName: 'should work', message: 'Expected true'});
 * // Returns: TestFailure validated object
 */

import { z } from '#gateway/npm/zod';

export const testFailureContract = z
  .object({
    suitePath: z.string().brand<'TestFailureSuitePath'>(),
    testName: z.string().brand<'TestFailureTestName'>(),
    message: z.string().brand<'TestFailureMessage'>(),
    stackTrace: z.string().brand<'TestFailureStackTrace'>().optional(),
  })
  .brand<'TestFailure'>();

export type TestFailure = z.infer<typeof testFailureContract>;
