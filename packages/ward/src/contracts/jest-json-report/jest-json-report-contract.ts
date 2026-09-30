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
    status: z.string().brand<'JestAssertionResultStatus'>().optional(),
    fullName: z.string().brand<'JestAssertionResultFullName'>().optional(),
    failureMessages: z.array(z.string().brand<'JestAssertionResultFailureMessages'>()).optional(),
    duration: z.number().brand<'JestAssertionResultDuration'>().nullable().optional(),
  }).brand<'JestAssertionResult'>()
  .loose();

const jestSuiteResultContract = z
  .object({
    name: z.string().brand<'JestSuiteResultName'>().optional(),
    status: z.string().brand<'JestSuiteResultStatus'>().optional(),
    message: z.string().brand<'JestSuiteResultMessage'>().optional(),
    assertionResults: z.array(jestAssertionResultContract).optional(),
    startTime: z.number().brand<'JestSuiteResultStartTime'>().optional(),
    endTime: z.number().brand<'JestSuiteResultEndTime'>().optional(),
  }).brand<'JestSuiteResult'>()
  .loose();

// Jest serializes each open handle as an Error through its own `serializeToJSON`, which keeps only
// `message`, `name` and `stack` — so this mirrors that shape and nothing wider.
const jestOpenHandleContract = z
  .object({
    name: z.string().brand<'JestOpenHandleName'>().optional(),
    message: z.string().brand<'JestOpenHandleMessage'>().optional(),
    stack: z.string().brand<'JestOpenHandleStack'>().optional(),
  }).brand<'JestOpenHandle'>()
  .loose();

export const jestJsonReportContract = z
  .object({
    numTotalTestSuites: z.number().brand<'JestJsonReportNumTotalTestSuites'>().optional(),
    numPassedTests: z.number().brand<'JestJsonReportNumPassedTests'>().optional(),
    testResults: z.array(jestSuiteResultContract).optional(),
    openHandles: z.array(jestOpenHandleContract).optional(),
  })
  .loose().brand<'JestJsonReport'>();

export type JestJsonReport = z.infer<typeof jestJsonReportContract>;
