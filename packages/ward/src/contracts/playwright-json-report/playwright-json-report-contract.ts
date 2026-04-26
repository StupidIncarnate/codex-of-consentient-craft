/**
 * PURPOSE: Validates the Playwright JSON reporter output (suites > specs > tests > results) consumed by ward
 *
 * USAGE:
 * playwrightJsonReportContract.parse(JSON.parse(playwrightJsonString));
 * // Returns: PlaywrightJsonReport with recursive suites, specs, tests, results
 */

import { z } from 'zod';

const playwrightTestResultContract = z
  .object({
    status: z.string().brand<'PlaywrightResultStatus'>().optional(),
    duration: z.number().brand<'PlaywrightResultDuration'>().optional(),
  })
  .passthrough();

const playwrightTestNodeContract = z
  .object({
    results: z.array(playwrightTestResultContract).optional(),
  })
  .passthrough();

const playwrightSpecContract = z
  .object({
    title: z.string().brand<'PlaywrightSpecTitle'>().optional(),
    file: z.string().brand<'PlaywrightSpecFile'>().optional(),
    tests: z.array(playwrightTestNodeContract).optional(),
  })
  .passthrough();

const playwrightSuiteBaseContract = z
  .object({
    title: z.string().brand<'PlaywrightSuiteTitle'>().optional(),
    specs: z.array(playwrightSpecContract).optional(),
  })
  .passthrough();

type PlaywrightSuiteBase = z.infer<typeof playwrightSuiteBaseContract>;
type PlaywrightSuiteBaseInput = z.input<typeof playwrightSuiteBaseContract>;

export type PlaywrightSuite = PlaywrightSuiteBase & {
  suites?: PlaywrightSuite[] | undefined;
};

type PlaywrightSuiteInput = PlaywrightSuiteBaseInput & {
  suites?: PlaywrightSuiteInput[] | undefined;
};

const playwrightSuiteContract: z.ZodType<PlaywrightSuite, z.ZodTypeDef, PlaywrightSuiteInput> =
  z.lazy(() =>
    playwrightSuiteBaseContract.and(
      z.object({
        suites: z.array(playwrightSuiteContract).optional(),
      }),
    ),
  );

export const playwrightJsonReportContract = z
  .object({
    suites: z.array(playwrightSuiteContract).optional(),
  })
  .passthrough();

export type PlaywrightJsonReport = z.infer<typeof playwrightJsonReportContract>;
