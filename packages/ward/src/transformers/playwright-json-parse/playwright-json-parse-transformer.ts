/**
 * PURPOSE: Parses Playwright JSON reporter output into an array of TestFailure values
 *
 * USAGE:
 * const failures = playwrightJsonParseTransformer({ jsonOutput: '{"suites":[...]}' });
 * // Returns TestFailure[] containing only failed test entries from recursive suite walk
 */

import type { TestFailure } from '../../contracts/test-failure/test-failure-contract';
import { playwrightSuiteWalkTransformer } from '../playwright-suite-walk/playwright-suite-walk-transformer';

export const playwrightJsonParseTransformer = ({
  jsonOutput,
}: {
  jsonOutput: string;
}): TestFailure[] => {
  const parsed: unknown = JSON.parse(jsonOutput);

  if (typeof parsed !== 'object' || parsed === null) {
    return [];
  }

  const suites: unknown = Reflect.get(parsed, 'suites');

  if (!Array.isArray(suites)) {
    return [];
  }

  return suites.flatMap((suite: unknown) =>
    playwrightSuiteWalkTransformer({ suite, parentPath: '' }),
  );
};
