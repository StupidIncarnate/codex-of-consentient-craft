/**
 * PURPOSE: Defines the structure of a single-level Playwright suite with specs and optional child suites
 *
 * USAGE:
 * playwrightSuiteContract.parse({ title: 'login', specs: [...] });
 * // Returns validated PlaywrightSuite
 */

import { z } from 'zod';
import { playwrightSpecContract } from '../playwright-spec/playwright-spec-contract';

export const playwrightSuiteContract = z.object({
  title: z.string().brand<'PlaywrightSuiteTitle'>(),
  specs: z.array(playwrightSpecContract).optional(),
  suites: z.array(z.unknown()).optional(),
});

export type PlaywrightSuite = z.infer<typeof playwrightSuiteContract>;
