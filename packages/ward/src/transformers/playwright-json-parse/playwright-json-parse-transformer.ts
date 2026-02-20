/**
 * PURPOSE: Parses Playwright JSON reporter output into an array of TestFailure values for failed tests only
 *
 * USAGE:
 * const failures = playwrightJsonParseTransformer({ jsonOutput: '{"suites":[...]}' });
 * // Returns TestFailure[] containing only failed test entries
 */

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';
import type { TestFailure } from '../../contracts/test-failure/test-failure-contract';
import { extractJsonObjectTransformer } from '../extract-json-object/extract-json-object-transformer';
import { collectPlaywrightFailuresTransformer } from '../collect-playwright-failures/collect-playwright-failures-transformer';

export const playwrightJsonParseTransformer = ({
  jsonOutput,
}: {
  jsonOutput: ErrorMessage;
}): TestFailure[] => {
  const jsonString = extractJsonObjectTransformer({ output: jsonOutput });
  const parsed: unknown = JSON.parse(jsonString);

  if (typeof parsed !== 'object' || parsed === null) {
    return [];
  }

  const suites: unknown = Reflect.get(parsed, 'suites');

  if (!Array.isArray(suites)) {
    return [];
  }

  return collectPlaywrightFailuresTransformer({ suites, titlePath: [] });
};
