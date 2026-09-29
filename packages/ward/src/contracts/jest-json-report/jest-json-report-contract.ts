/**
 * PURPOSE: Validates Jest JSON CLI output (numTotalTestSuites, numPassedTests, testResults[]) consumed by ward
 *
 * USAGE:
 * jestJsonReportContract.parse(JSON.parse(jestJsonString));
 * // Returns: JestJsonReport with optional summary counts and per-suite results
 */

import { z } from '#gateway/npm/zod';

const jestAssertionResultContract = z
  .object({
    status: z.string().brand<'JestAssertionStatus'>().optional(),
    fullName: z.string().brand<'JestAssertionFullName'>().optional(),
    failureMessages: z.array(z.string().brand<'JestFailureMessage'>()).optional(),
    duration: z.number().brand<'JestAssertionDuration'>().nullable().optional(),
  })
  .loose();

const jestSuiteResultContract = z
  .object({
    name: z.string().brand<'JestSuiteName'>().optional(),
    status: z.string().brand<'JestSuiteStatus'>().optional(),
    message: z.string().brand<'JestSuiteMessage'>().optional(),
    assertionResults: z.array(jestAssertionResultContract).optional(),
    startTime: z.number().brand<'JestSuiteStartTime'>().optional(),
    endTime: z.number().brand<'JestSuiteEndTime'>().optional(),
  })
  .loose();

// Jest serializes each open handle as an Error through its own `serializeToJSON`, which keeps only
// `message`, `name` and `stack` — so this mirrors that shape and nothing wider.
const jestOpenHandleContract = z
  .object({
    name: z.string().brand<'JestOpenHandleName'>().optional(),
    message: z.string().brand<'JestOpenHandleMessage'>().optional(),
    stack: z.string().brand<'JestOpenHandleStack'>().optional(),
  })
  .loose();

export const jestJsonReportContract = z
  .object({
    numTotalTestSuites: z.number().brand<'JestNumTotalTestSuites'>().optional(),
    numPassedTests: z.number().brand<'JestNumPassedTests'>().optional(),
    testResults: z.array(jestSuiteResultContract).optional(),
    openHandles: z.array(jestOpenHandleContract).optional(),
  })
  .loose();

export type JestJsonReport = z.infer<typeof jestJsonReportContract>;
