/**
 * PURPOSE: Validates the Playwright JSON reporter output (suites > specs > tests > results) consumed by ward
 *
 * USAGE:
 * playwrightJsonReportContract.parse(JSON.parse(playwrightJsonString));
 * // Returns: PlaywrightJsonReport with recursive suites, specs, tests, results
 */

import { z } from '#gateway/npm/zod';

const playwrightTestResultContract = z
  .object({
    status: z.string().brand<'PlaywrightTestResultStatus'>().optional(),
    duration: z.number().brand<'PlaywrightTestResultDuration'>().optional(),
  })
  .brand<'PlaywrightTestResult'>()
  .loose();

const playwrightTestNodeContract = z
  .object({
    results: z.array(playwrightTestResultContract).optional(),
  })
  .brand<'PlaywrightTestNode'>()
  .loose();

const playwrightSpecContract = z
  .object({
    title: z.string().brand<'PlaywrightSpecTitle'>().optional(),
    file: z.string().brand<'PlaywrightSpecFile'>().optional(),
    tests: z.array(playwrightTestNodeContract).optional(),
  })
  .brand<'PlaywrightSpec'>()
  .loose();

const playwrightSuiteFields = z.object({
  title: z.string().brand<'PlaywrightSuiteTitle'>().optional(),
  specs: z.array(playwrightSpecContract).optional(),
});

type PlaywrightSuiteSelf = z.infer<typeof playwrightSuiteFields> & {
  suites?: PlaywrightSuiteSelf[] | undefined;
} & z.$brand<'PlaywrightSuite'>;

// A getter, not `z.lazy` + `.and()` — the getter's return type wraps `z.core.$ZodType`, which is
// the only self-reference form `contracts/` allows (zod v4 dropped the old `z.ZodTypeDef` type
// param `z.lazy` needed here).
const playwrightSuiteContract = z
  .object({
    ...playwrightSuiteFields.shape,
    get suites(): z.ZodOptional<z.ZodArray<z.core.$ZodType<PlaywrightSuiteSelf>>> {
      return z.array(playwrightSuiteContract).optional();
    },
  })
  .brand<'PlaywrightSuite'>()
  .loose();

export type PlaywrightSuite = z.infer<typeof playwrightSuiteContract>;

export const playwrightJsonReportContract = z
  .object({
    suites: z.array(playwrightSuiteContract).optional(),
  })
  .loose()
  .brand<'PlaywrightJsonReport'>();

export type PlaywrightJsonReport = z.infer<typeof playwrightJsonReportContract>;
