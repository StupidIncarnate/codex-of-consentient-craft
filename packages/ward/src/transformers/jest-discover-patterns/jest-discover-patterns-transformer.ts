/**
 * PURPOSE: Generates Jest file discovery patterns based on package jest config and check type
 *
 * USAGE:
 * const { patterns, excludePatterns } = jestDiscoverPatternsTransformer({ checkType: 'unit', hasPackageJestConfig: true });
 * // Returns: { patterns: ['src/**\/*.test.ts'], excludePatterns: ['**\/*.integration.test.ts', '**\/*.e2e.test.ts'] }
 */

import { jestDiscoverPatternsContract } from '../../contracts/jest-discover-patterns/jest-discover-patterns-contract';
import type { JestDiscoverPatterns } from '../../contracts/jest-discover-patterns/jest-discover-patterns-contract';
import { checkCommandsStatics } from '../../statics/check-commands/check-commands-statics';
import { tsExtensionsStatics } from '../../statics/ts-extensions/ts-extensions-statics';

const exts = tsExtensionsStatics.allExtensions;

export const jestDiscoverPatternsTransformer = ({
  checkType,
  hasPackageJestConfig,
}: {
  checkType: 'unit' | 'integration';
  hasPackageJestConfig: boolean;
}): JestDiscoverPatterns => {
  const statics = checkCommandsStatics[checkType];
  const fallbackPatterns = statics.discoverPatterns.map((p) => p);
  const fallbackExclude =
    'excludePatterns' in statics
      ? statics.excludePatterns.map((p: string) => p)
      : [];

  if (!hasPackageJestConfig) {
    return jestDiscoverPatternsContract.parse({ patterns: fallbackPatterns, excludePatterns: fallbackExclude });
  }

  if (checkType === 'unit') {
    return jestDiscoverPatternsContract.parse({
      patterns: exts.flatMap((ext) => [
        `src/**/*.test.${ext}`,
        `test/**/*.test.${ext}`,
      ]),
      // `bin/**` and `tests/**` integration/e2e excludes mirror the integration-branch
      // discovery roots so a `bin/` integration test or a `tests/integration/` test is
      // never collected as a unit test. `.e2e.test` is retained defensively — e2e is
      // Playwright-only (`*.e2e.ts`), so no repo file carries the Jest suffix, but a stray
      // one must still stay out of the unit run.
      excludePatterns: exts.flatMap((ext) => [
        `**/*.integration.test.${ext}`,
        `**/*.e2e.test.${ext}`,
        `bin/**/*.integration.test.${ext}`,
        `bin/**/*.e2e.test.${ext}`,
        `tests/**/*.integration.test.${ext}`,
        `tests/**/*.e2e.test.${ext}`,
      ]),
    });
  }

  return jestDiscoverPatternsContract.parse({
    patterns: exts.flatMap((ext) => [
      `src/**/*.integration.test.${ext}`,
      `test/**/*.integration.test.${ext}`,
      `bin/**/*.integration.test.${ext}`,
      `tests/**/*.integration.test.${ext}`,
    ]),
    excludePatterns: [],
  });
};
